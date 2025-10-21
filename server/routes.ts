import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
import { users, emailLogs } from "@shared/schema";
import { eq } from "drizzle-orm";

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

      // Download all pages
      const pages: PageBuffer[] = [];
      for (const pageUrl of pageUrls) {
        const objectFile = await objectStorageService.getObjectEntityFile(pageUrl);
        const buffer = await objectStorageService.getObjectBuffer(objectFile);
        
        // Determine MIME type from file extension or object metadata
        const extension = pageUrl.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg';
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'pdf') mimeType = 'application/pdf';

        pages.push({ buffer, mimeType });
      }

      // Combine to PDF
      const pdfBuffer = await combineImagesToPDF(pages);

      // Send PDF
      const fileName = `${document.title}.pdf`;
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

      const archiver = require('archiver');
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
            
            // Create safe filename
            const safeTitle = doc.title.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '_');
            const extension = pageUrl.split('.').pop() || 'bin';
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
  app.get('/objects/:objectPath(*)', async (req: any, res) => {
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
    console.log('[Email Webhook] Received email');
    console.log('[Email Webhook] Body keys:', Object.keys(req.body).join(', '));
    console.log('[Email Webhook] timestamp:', req.body.timestamp);
    console.log('[Email Webhook] token:', req.body.token?.substring(0, 20) + '...');
    console.log('[Email Webhook] signature:', req.body.signature);
    
    try {
      // Verify Mailgun webhook signature
      const timestamp = req.body.timestamp || '';
      const token = req.body.token || '';
      const signature = req.body.signature || '';
      
      console.log('[Email Webhook] Calling verifyMailgunWebhook with:', {
        timestampLength: timestamp.length,
        tokenLength: token.length,
        signatureLength: signature.length
      });
      
      const isValid = verifyMailgunWebhook(timestamp, token, signature);
      console.log('[Email Webhook] Verification result:', isValid);
      
      if (!isValid) {
        console.error('[Email Webhook] Invalid signature - rejecting request');
        return res.status(403).json({ message: 'Invalid signature' });
      }
      
      const { from, subject, attachments } = parseMailgunWebhook(req.body, req.files);
      const rawRecipient = req.body.recipient || '';
      
      // Extract clean email addresses from formatted strings
      const cleanFrom = extractEmailAddress(from);
      const cleanRecipient = extractEmailAddress(rawRecipient);
      
      console.log('[Email Webhook] From:', cleanFrom, '(raw:', from + ')');
      console.log('[Email Webhook] To:', cleanRecipient, '(raw:', rawRecipient + ')');
      console.log('[Email Webhook] Attachments:', attachments.length);
      
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

  const httpServer = createServer(app);

  return httpServer;
}
