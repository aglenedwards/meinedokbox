import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, optionalAuth } from "./replitAuth";
import { analyzeDocument, analyzeDocumentFromText } from "./lib/openai";
import { extractTextFromPdf } from "./lib/pdfParser";
import { uploadFile } from "./lib/storage";
import { convertPdfToImages } from "./lib/pdfToImage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertDocumentSchema, DOCUMENT_CATEGORIES } from "@shared/schema";
import { combineImagesToPDF, type PageBuffer } from "./lib/pdfGenerator";
import { parseMailgunWebhook, isSupportedAttachment, isEmailWhitelisted, verifyMailgunWebhook, extractEmailAddress } from "./lib/emailInbound";
import { db } from "./db";
import { users, emailLogs, invites, accountMembers, accounts, documents } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { AccountService } from "./lib/accountService";
import crypto from "crypto";

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimes = [
      'image/jpeg',      // .jpg, .jpeg
      'image/png',       // .png
      'image/webp',      // .webp
      'image/gif',       // .gif
      'application/pdf'  // .pdf
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Ungültiger Dateityp. Bitte laden Sie nur Bilder (JPEG, PNG, WEBP, GIF) oder PDF-Dateien hoch.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Regenerate inbound email address for user
  app.post('/api/auth/regenerate-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { generateInboundEmail } = await import('./lib/emailInbound');
      const newEmail = generateInboundEmail(userId);
      
      // Update user in database
      await db.update(users)
        .set({ inboundEmail: newEmail })
        .where(eq(users.id, userId));
      
      console.log(`[Regenerate Email] Generated new email for user ${userId}: ${newEmail}`);
      
      res.json({ inboundEmail: newEmail });
    } catch (error) {
      console.error("Error regenerating email:", error);
      res.status(500).json({ message: "Failed to regenerate email" });
    }
  });

  // Document upload endpoint - supports single or multiple files
  app.post('/api/documents/upload', isAuthenticated, upload.array('files', 20), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const firstFile = files[0];
      const isPdf = firstFile.mimetype === 'application/pdf';

      console.log(`Processing ${files.length} file(s) as ${isPdf ? 'PDF' : 'image'} document`);

      let analysisResult;

      if (isPdf) {
        // Handle PDF: Extract text and analyze
        if (files.length > 1) {
          return res.status(400).json({ 
            message: "Bitte laden Sie nur eine PDF-Datei gleichzeitig hoch."
          });
        }

        const extractedText = await extractTextFromPdf(firstFile.buffer);
        console.log(`Extracted ${extractedText.length} characters from PDF`);
        
        // If PDF text extraction yielded too little text (< 50 chars), 
        // it's likely a scanned document - convert to images and use Vision API
        if (extractedText.length < 50) {
          console.log('PDF has insufficient text, converting to images for Vision API OCR');
          const pdfImages = await convertPdfToImages(firstFile.buffer);
          const imagesForAnalysis = pdfImages.map(img => ({
            base64: img.base64,
            mimeType: img.mimeType,
          }));
          analysisResult = await analyzeDocument(imagesForAnalysis);
        } else {
          analysisResult = await analyzeDocumentFromText(extractedText);
        }
      } else {
        // Handle images: Use Vision API
        const imagesForAnalysis = files.map(file => ({
          base64: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        }));
        analysisResult = await analyzeDocument(imagesForAnalysis);
      }
      
      // Upload files (images as pages, PDF as single file)
      await processMultiPageUpload(userId, files, analysisResult, res);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Failed to upload document",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  async function processMultiPageUpload(
    userId: string,
    files: Express.Multer.File[],
    analysisResult: any,
    res: any
  ) {
    const objectStorageService = new ObjectStorageService();
    const pageUrls: string[] = [];
    let thumbnailPath: string | null = null;

    // Upload each page separately
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { filePath, thumbnailPath: pageThumbnail } = await uploadFile(
        file.buffer,
        file.originalname,
        userId
      );

      // Set ACL policy on uploaded file (private, owner = userId)
      await objectStorageService.trySetObjectEntityAclPolicy(filePath, {
        owner: userId,
        visibility: "private",
      });

      pageUrls.push(filePath);

      // Use the first page's thumbnail as the document thumbnail
      if (i === 0 && pageThumbnail) {
        thumbnailPath = pageThumbnail;
        await objectStorageService.trySetObjectEntityAclPolicy(thumbnailPath, {
          owner: userId,
          visibility: "private",
        });
      }
    }

    // Create document record in database
    const documentData = {
      userId,
      title: analysisResult.title,
      category: analysisResult.category,
      extractedText: analysisResult.extractedText,
      pageUrls,
      thumbnailUrl: thumbnailPath,
      mimeType: files[0].mimetype, // Store original MIME type
      confidence: analysisResult.confidence,
      // Phase 2: Smart metadata
      extractedDate: analysisResult.extractedDate ? new Date(analysisResult.extractedDate) : null,
      amount: analysisResult.amount ?? null,
      sender: analysisResult.sender ?? null,
    };

    // Validate with Zod schema
    const validatedData = insertDocumentSchema.parse(documentData);
    const document = await storage.createDocument(validatedData);

    res.json(document);
  }

  // Get storage statistics for authenticated user
  app.get('/api/storage/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStorageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching storage stats:", error);
      res.status(500).json({ message: "Failed to fetch storage stats" });
    }
  });

  // Get all documents for authenticated user with optional search/filter/sort
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { search, categories, sort } = req.query;

      // Parse categories from query string (comma-separated)
      const categoryArray = categories 
        ? (categories as string).split(',').filter(c => c.trim())
        : undefined;

      const documents = await storage.searchDocuments(
        userId,
        search as string | undefined,
        categoryArray,
        sort as any
      );

      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get single document
  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify user owns the document
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Download document as PDF (combines all pages)
  app.get('/api/documents/:id/download-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectStorageService = new ObjectStorageService();
      const pageUrls = document.pageUrls && document.pageUrls.length > 0 
        ? document.pageUrls 
        : document.fileUrl 
          ? [document.fileUrl] 
          : [];

      if (pageUrls.length === 0) {
        return res.status(400).json({ message: "No pages found" });
      }

      // Check if document is already a PDF (via mimeType in DB or fileUrl)
      const isPdf = document.mimeType === 'application/pdf' || 
                    document.fileUrl?.toLowerCase().endsWith('.pdf');

      let pdfBuffer: Buffer;
      const fileName = `${document.title}.pdf`;

      if (isPdf && pageUrls.length === 1) {
        // Document is already a PDF - stream it directly
        const objectFile = await objectStorageService.getObjectEntityFile(pageUrls[0]);
        pdfBuffer = await objectStorageService.getObjectBuffer(objectFile);
      } else {
        // Document is images - convert to PDF
        const pages: PageBuffer[] = [];
        for (const pageUrl of pageUrls) {
          const objectFile = await objectStorageService.getObjectEntityFile(pageUrl);
          const buffer = await objectStorageService.getObjectBuffer(objectFile);
          
          // Determine MIME type from file extension or object metadata
          const extension = pageUrl.split('.').pop()?.toLowerCase();
          let mimeType = 'image/jpeg';
          if (extension === 'png') mimeType = 'image/png';
          else if (extension === 'webp') mimeType = 'image/webp';

          pages.push({ buffer, mimeType });
        }

        // Combine images to PDF
        pdfBuffer = await combineImagesToPDF(pages);
      }

      // Send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Update document category
  app.patch('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { category } = req.body;

      // Validate category
      const validCategories = [...DOCUMENT_CATEGORIES];
      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({ 
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
        });
      }

      // Update category
      const updated = await storage.updateDocumentCategory(id, userId, category);

      if (!updated) {
        return res.status(404).json({ message: "Document not found or access denied" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Delete document (soft delete - moves to trash)
  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify document exists and user owns it
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Soft delete document (moves to trash)
      const deleted = await storage.deleteDocument(id, userId);

      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete document" });
      }

      res.json({ message: "Document moved to trash" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Bulk delete documents (soft delete - moves to trash)
  app.post('/api/documents/bulk-delete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No document IDs provided" });
      }

      const deletedCount = await storage.bulkDeleteDocuments(ids, userId);

      res.json({ 
        message: `${deletedCount} document(s) moved to trash`,
        count: deletedCount 
      });
    } catch (error) {
      console.error("Error bulk deleting documents:", error);
      res.status(500).json({ message: "Failed to delete documents" });
    }
  });

  // Get trashed documents
  app.get('/api/trash', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trashedDocuments = await storage.getTrashedDocuments(userId);
      res.json(trashedDocuments);
    } catch (error) {
      console.error("Error fetching trashed documents:", error);
      res.status(500).json({ message: "Failed to fetch trashed documents" });
    }
  });

  // Restore document from trash
  app.post('/api/documents/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const restored = await storage.restoreDocument(id, userId);

      if (!restored) {
        return res.status(404).json({ message: "Document not found in trash or access denied" });
      }

      res.json(restored);
    } catch (error) {
      console.error("Error restoring document:", error);
      res.status(500).json({ message: "Failed to restore document" });
    }
  });

  // Permanently delete document from trash
  app.delete('/api/trash/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const deleted = await storage.permanentlyDeleteDocument(id, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Document not found in trash or access denied" });
      }

      res.json({ message: "Document permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting document:", error);
      res.status(500).json({ message: "Failed to permanently delete document" });
    }
  });

  // Phase 2: Tags API routes
  
  // Get all tags for user
  app.get('/api/tags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTags = await storage.getTags(userId);
      res.json(userTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Create new tag
  app.post('/api/tags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }

      const tag = await storage.createTag({
        userId,
        name,
        color: color || "#3b82f6",
      });

      res.json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  // Update tag
  app.patch('/api/tags/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { name, color } = req.body;

      const updated = await storage.updateTag(id, userId, { name, color });

      if (!updated) {
        return res.status(404).json({ message: "Tag not found or access denied" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  // Delete tag
  app.delete('/api/tags/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const deleted = await storage.deleteTag(id, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Tag not found or access denied" });
      }

      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Add tag to document
  app.post('/api/documents/:documentId/tags/:tagId', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId, tagId } = req.params;
      const documentTag = await storage.addTagToDocument(documentId, tagId);
      res.json(documentTag);
    } catch (error) {
      console.error("Error adding tag to document:", error);
      res.status(500).json({ message: "Failed to add tag to document" });
    }
  });

  // Remove tag from document
  app.delete('/api/documents/:documentId/tags/:tagId', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId, tagId } = req.params;
      const removed = await storage.removeTagFromDocument(documentId, tagId);
      
      if (!removed) {
        return res.status(404).json({ message: "Tag association not found" });
      }

      res.json({ message: "Tag removed from document" });
    } catch (error) {
      console.error("Error removing tag from document:", error);
      res.status(500).json({ message: "Failed to remove tag from document" });
    }
  });

  // Get all tags for a document
  app.get('/api/documents/:documentId/tags', isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const documentTags = await storage.getDocumentTags(documentId);
      res.json(documentTags);
    } catch (error) {
      console.error("Error fetching document tags:", error);
      res.status(500).json({ message: "Failed to fetch document tags" });
    }
  });

  // Phase 2: Export functionality - download all documents as ZIP
  app.get('/api/documents/export/zip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getDocumentsByUserId(userId);

      if (documents.length === 0) {
        return res.status(404).json({ message: "No documents to export" });
      }

      const archiver = (await import('archiver')).default;
      const objectStorageService = new ObjectStorageService();

      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="meinedokbox_export_${new Date().toISOString().split('T')[0]}.zip"`);

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      archive.pipe(res);

      // Add each document to the archive
      for (const doc of documents) {
        const pageUrls = doc.pageUrls && doc.pageUrls.length > 0 
          ? doc.pageUrls 
          : doc.fileUrl 
            ? [doc.fileUrl] 
            : [];

        for (let i = 0; i < pageUrls.length; i++) {
          try {
            const pageUrl = pageUrls[i];
            const objectFile = await objectStorageService.getObjectEntityFile(pageUrl);
            const [fileBuffer] = await objectFile.download();
            
            // Create safe filename with correct extension from MIME type
            const safeTitle = doc.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '_');
            const mimeTypeToExt: Record<string, string> = {
              'application/pdf': 'pdf',
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp',
              'image/gif': 'gif',
            };
            const extension = doc.mimeType ? (mimeTypeToExt[doc.mimeType] || 'bin') : 'bin';
            const filename = pageUrls.length > 1 
              ? `${safeTitle}_page_${i + 1}.${extension}`
              : `${safeTitle}.${extension}`;
            
            archive.append(fileBuffer, { name: filename });
          } catch (error) {
            console.error(`Failed to add document ${doc.id} to archive:`, error);
          }
        }
      }

      await archive.finalize();
    } catch (error) {
      console.error("Error exporting documents:", error);
      res.status(500).json({ message: "Failed to export documents" });
    }
  });

  // Serve uploaded document files with ACL check
  app.get('/objects/:objectPath(*)', optionalAuth, async (req: any, res) => {
    try {
      const objectPath = `/objects/${req.params.objectPath}`;
      console.log('Serving object:', objectPath);
      const objectStorageService = new ObjectStorageService();

      // Get the object file
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      console.log('Object file found:', objectFile.name);

      // Get userId from session if authenticated
      const userId = req.user?.claims?.sub;
      console.log('User ID:', userId || 'unauthenticated');

      // Check ACL permissions
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      console.log('Can access:', canAccess);

      if (!canAccess) {
        console.log('Access denied for user:', userId);
        return res.status(403).json({ message: "Access denied" });
      }

      // Stream the file to the response
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        console.log('Object not found:', `/objects/${req.params.objectPath}`);
        return res.status(404).json({ message: "Object not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ message: "Failed to serve object" });
    }
  });

  // E-Mail Inbound Webhook (Public - no authentication)
  // Receives emails from Mailgun and processes attachments
  app.post('/api/webhook/email', upload.any(), async (req: any, res) => {
    try {
      // Verify Mailgun webhook signature
      const timestamp = req.body.timestamp || '';
      const token = req.body.token || '';
      const signature = req.body.signature || '';
      
      const isValid = verifyMailgunWebhook(timestamp, token, signature);
      
      if (!isValid) {
        console.error('[Email Webhook] Invalid signature - rejecting request');
        return res.status(403).json({ message: 'Invalid signature' });
      }
      
      const { from, subject, attachments } = parseMailgunWebhook(req.body, req.files);
      const rawRecipient = req.body.recipient || '';
      
      // Extract clean email addresses from formatted strings
      const cleanFrom = extractEmailAddress(from);
      const cleanRecipient = extractEmailAddress(rawRecipient);
      
      console.log('[Email Webhook] Processing email from:', cleanFrom, 'to:', cleanRecipient, 'attachments:', attachments.length);
      
      // Find user by inbound email address (case-insensitive)
      const [user] = await db.select().from(users).where(eq(users.inboundEmail, cleanRecipient)).limit(1);
      
      if (!user) {
        console.log('[Email Webhook] Unknown recipient:', cleanRecipient);
        return res.status(200).json({ message: 'Unknown recipient' });
      }
      
      // Check whitelist
      if (!isEmailWhitelisted(cleanFrom, user.emailWhitelist || null)) {
        console.log('[Email Webhook] Sender not whitelisted:', cleanFrom);
        await db.insert(emailLogs).values({
          userId: user.id,
          fromAddress: cleanFrom,
          subject: subject || '',
          attachmentCount: attachments.length,
          processedCount: 0,
          status: 'error',
          errorMessage: 'Sender not in whitelist'
        });
        return res.status(200).json({ message: 'Sender not allowed' });
      }
      
      // Create email log
      const [emailLog] = await db.insert(emailLogs).values({
        userId: user.id,
        fromAddress: cleanFrom,
        subject: subject || '',
        attachmentCount: attachments.length,
        processedCount: 0,
        status: 'pending'
      }).returning();
      
      // Filter supported attachments
      const supportedAttachments = attachments.filter(att => 
        isSupportedAttachment(att.contentType, att.filename)
      );
      
      console.log('[Email Webhook] Processing', supportedAttachments.length, 'supported attachments');
      
      let processedCount = 0;
      const errors: string[] = [];
      
      // Process each attachment
      for (const attachment of supportedAttachments) {
        try {
          console.log('[Email Webhook] Processing attachment:', attachment.filename);
          
          // Convert Buffer to File-like object for existing pipeline
          const fileData: Express.Multer.File = {
            fieldname: 'file',
            originalname: attachment.filename,
            encoding: '7bit',
            mimetype: attachment.contentType,
            buffer: attachment.content,
            size: attachment.size
          } as Express.Multer.File;
          
          // Analyze document using existing pipeline
          let analysisResult;
          if (attachment.contentType === 'application/pdf') {
            const extractedText = await extractTextFromPdf(attachment.content);
            analysisResult = await analyzeDocumentFromText(extractedText);
          } else {
            // For images, create ImageWithMimeType array
            analysisResult = await analyzeDocument([{
              base64: attachment.content.toString('base64'),
              mimeType: attachment.contentType
            }]);
          }
          
          // Store file in object storage
          const { filePath, thumbnailPath } = await uploadFile(
            attachment.content,
            attachment.filename,
            user.id
          );
          
          // Save to database
          await storage.createDocument({
            userId: user.id,
            title: analysisResult.title,
            category: analysisResult.category,
            extractedText: analysisResult.extractedText,
            fileUrl: filePath,
            thumbnailUrl: thumbnailPath,
            mimeType: attachment.contentType, // Store MIME type
            confidence: analysisResult.confidence,
            extractedDate: analysisResult.extractedDate ? new Date(analysisResult.extractedDate) : null,
            amount: analysisResult.amount,
            sender: analysisResult.sender,
          });
          
          processedCount++;
          console.log('[Email Webhook] Successfully processed:', attachment.filename);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('[Email Webhook] Failed to process attachment:', attachment.filename, errorMsg);
          errors.push(`${attachment.filename}: ${errorMsg}`);
        }
      }
      
      // Update email log
      await db.update(emailLogs)
        .set({
          processedCount,
          status: processedCount > 0 ? 'success' : 'error',
          errorMessage: errors.length > 0 ? errors.join('; ') : null
        })
        .where(eq(emailLogs.id, emailLog.id));
      
      console.log('[Email Webhook] Completed. Processed:', processedCount, 'Errors:', errors.length);
      
      res.status(200).json({
        message: `Processed ${processedCount} of ${attachments.length} attachments`,
        processed: processedCount,
        total: attachments.length
      });
      
    } catch (error) {
      console.error('[Email Webhook] Error processing email:', error);
      res.status(500).json({ 
        message: 'Failed to process email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============================================
  // ACCOUNT MANAGEMENT ROUTES
  // ============================================

  const accountService = new AccountService();

  // Get account information with seats and members
  app.get('/api/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's account
      const accountId = await accountService.getAccountByUserId(userId);
      
      if (!accountId) {
        return res.status(404).json({ message: "Account not found" });
      }

      const accountDetails = await accountService.getAccountDetails(accountId);
      
      if (!accountDetails) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Enrich members with user data
      const membersWithUserData = await Promise.all(
        accountDetails.members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            profileImageUrl: user?.profileImageUrl,
          };
        })
      );

      res.json({
        ...accountDetails,
        members: membersWithUserData,
      });
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  // Create invitation
  app.post('/api/account/invites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Gültige E-Mail-Adresse erforderlich" });
      }

      // Get user's account
      const accountId = await accountService.getAccountByUserId(userId);
      
      if (!accountId) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Check if user is owner
      const isOwner = await accountService.isAccountOwner(userId, accountId);
      
      if (!isOwner) {
        return res.status(403).json({ message: "Nur der Account-Inhaber kann Einladungen versenden" });
      }

      // Check seats availability
      const canInvite = await accountService.canInviteMore(accountId);
      
      if (!canInvite) {
        return res.status(400).json({ 
          message: "Keine freien Plätze mehr verfügbar. Bitte upgraden Sie Ihren Plan." 
        });
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        // Check if already member
        const existingMember = await db.query.accountMembers.findFirst({
          where: and(
            eq(accountMembers.accountId, accountId),
            eq(accountMembers.userId, existingUser.id)
          ),
        });

        if (existingMember) {
          return res.status(400).json({ message: "Dieser Nutzer ist bereits Mitglied" });
        }
      }

      // Check if already invited
      const existingInvite = await db.query.invites.findFirst({
        where: and(
          eq(invites.accountId, accountId),
          eq(invites.email, email),
          eq(invites.status, "pending")
        ),
      });

      if (existingInvite) {
        return res.status(400).json({ message: "Einladung bereits versendet" });
      }

      // Create invite token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Insert invite
      const [invite] = await db.insert(invites).values({
        accountId,
        email,
        token,
        invitedBy: userId,
        expiresAt,
        role: "member",
        canUpload: true,
      }).returning();

      // Send invitation email
      const { sendInvitationEmail } = await import('./lib/emailService');
      const inviter = await storage.getUser(userId);
      await sendInvitationEmail(email, token, inviter?.email || 'jemand');

      res.json({ 
        message: "Einladung erfolgreich versendet",
        invite: {
          id: invite.id,
          email: invite.email,
          status: invite.status,
          createdAt: invite.createdAt,
        }
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Einladung" });
    }
  });

  // Accept invitation
  app.post('/api/account/invites/:token/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { token } = req.params;

      // Find invite
      const invite = await db.query.invites.findFirst({
        where: and(
          eq(invites.token, token),
          eq(invites.status, "pending")
        ),
      });

      if (!invite) {
        return res.status(404).json({ message: "Einladung nicht gefunden oder bereits verwendet" });
      }

      // Check expiry
      if (new Date() > invite.expiresAt) {
        await db.update(invites)
          .set({ status: "expired" })
          .where(eq(invites.id, invite.id));
        
        return res.status(400).json({ message: "Einladung ist abgelaufen" });
      }

      // Verify email matches
      const user = await storage.getUser(userId);
      if (user?.email !== invite.email) {
        return res.status(403).json({ 
          message: "Diese Einladung ist für eine andere E-Mail-Adresse bestimmt" 
        });
      }

      // Check if user already has an account (as owner)
      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.ownerUserId, userId),
      });

      if (existingAccount) {
        return res.status(400).json({ 
          message: "Sie sind bereits Owner eines Accounts. Sie können nicht als Member beitreten." 
        });
      }

      // Check seats availability
      const canInvite = await accountService.canInviteMore(invite.accountId);
      
      if (!canInvite) {
        return res.status(400).json({ 
          message: "Keine freien Plätze mehr verfügbar" 
        });
      }

      // Add user as member
      await db.insert(accountMembers).values({
        accountId: invite.accountId,
        userId,
        role: invite.role,
        canUpload: invite.canUpload,
      });

      // Mark invite as accepted
      await db.update(invites)
        .set({ 
          status: "accepted",
          acceptedAt: new Date()
        })
        .where(eq(invites.id, invite.id));

      // Move user's documents to the account
      await db.update(documents)
        .set({ accountId: invite.accountId })
        .where(eq(documents.userId, userId));

      res.json({ 
        message: "Einladung erfolgreich angenommen",
        accountId: invite.accountId
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Fehler beim Annehmen der Einladung" });
    }
  });

  // Get account members
  app.get('/api/account/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's account
      const accountId = await accountService.getAccountByUserId(userId);
      
      if (!accountId) {
        return res.status(404).json({ message: "Account not found" });
      }

      const members = await db.query.accountMembers.findMany({
        where: eq(accountMembers.accountId, accountId),
      });

      // Enrich with user data
      const membersWithUserData = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            profileImageUrl: user?.profileImageUrl,
          };
        })
      );

      res.json(membersWithUserData);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Remove member from account
  app.delete('/api/account/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { memberId } = req.params;

      // Get user's account
      const accountId = await accountService.getAccountByUserId(userId);
      
      if (!accountId) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Check if user is owner
      const isOwner = await accountService.isAccountOwner(userId, accountId);
      
      if (!isOwner) {
        return res.status(403).json({ message: "Nur der Account-Inhaber kann Mitglieder entfernen" });
      }

      // Find member
      const member = await db.query.accountMembers.findFirst({
        where: and(
          eq(accountMembers.id, memberId),
          eq(accountMembers.accountId, accountId)
        ),
      });

      if (!member) {
        return res.status(404).json({ message: "Mitglied nicht gefunden" });
      }

      // Cannot remove owner
      if (member.role === "owner") {
        return res.status(400).json({ message: "Der Account-Inhaber kann nicht entfernt werden" });
      }

      // Remove member
      await db.delete(accountMembers)
        .where(eq(accountMembers.id, memberId));

      res.json({ message: "Mitglied erfolgreich entfernt" });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ message: "Fehler beim Entfernen des Mitglieds" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
