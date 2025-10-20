import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeDocument } from "./lib/openai";
import { uploadFile } from "./lib/storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertDocumentSchema } from "@shared/schema";
import { combineImagesToPDF, type PageBuffer } from "./lib/pdfGenerator";

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed.'));
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

  // Document upload endpoint - supports single or multiple files
  app.post('/api/documents/upload', isAuthenticated, upload.array('files', 20), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      let fileBuffer: Buffer;
      let fileName: string;

      // For multiple files, send each image separately to OpenAI for analysis
      // Then combine them into a PDF for storage
      if (files.length > 1) {
        console.log(`Processing ${files.length} files as multi-page document`);
        
        // Prepare images for OpenAI analysis (each with its own MIME type)
        const imagesForAnalysis = files.map(file => ({
          base64: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        }));
        
        // Analyze document with OpenAI (send all pages as separate images)
        const analysisResult = await analyzeDocument(imagesForAnalysis);
        
        // Combine them into a PDF for storage
        const pages: PageBuffer[] = files.map(file => ({
          buffer: file.buffer,
          mimeType: file.mimetype,
        }));
        fileBuffer = await combineImagesToPDF(pages);
        fileName = 'combined-document.pdf';
        
        // Continue with upload
        await processUpload(userId, fileBuffer, fileName, analysisResult, res);
      } else {
        // Single file upload
        fileBuffer = files[0].buffer;
        fileName = files[0].originalname;
        
        const imagesForAnalysis = [{
          base64: fileBuffer.toString('base64'),
          mimeType: files[0].mimetype,
        }];
        
        // Analyze document with OpenAI
        const analysisResult = await analyzeDocument(imagesForAnalysis);
        
        // Continue with upload
        await processUpload(userId, fileBuffer, fileName, analysisResult, res);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Failed to upload document",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  async function processUpload(
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    analysisResult: any,
    res: any
  ) {
    // Upload file to object storage
    const { filePath, thumbnailPath } = await uploadFile(
      fileBuffer,
      fileName,
      userId
    );

    // Set ACL policy on uploaded file (private, owner = userId)
    const objectStorageService = new ObjectStorageService();
    await objectStorageService.trySetObjectEntityAclPolicy(filePath, {
      owner: userId,
      visibility: "private",
    });

    if (thumbnailPath) {
      await objectStorageService.trySetObjectEntityAclPolicy(thumbnailPath, {
        owner: userId,
        visibility: "private",
      });
    }

    // Create document record in database
    const documentData = {
      userId,
      title: analysisResult.title,
      category: analysisResult.category,
      extractedText: analysisResult.extractedText,
      fileUrl: filePath,
      thumbnailUrl: thumbnailPath,
      confidence: analysisResult.confidence,
    };

    // Validate with Zod schema
    const validatedData = insertDocumentSchema.parse(documentData);
    const document = await storage.createDocument(validatedData);

    res.json(document);
  }

  // Get all documents for authenticated user with optional search/filter
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { search, category } = req.query;

      const documents = await storage.searchDocuments(
        userId,
        search as string | undefined,
        category as string | undefined
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

  // Delete document
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

      // Delete document from database
      const deleted = await storage.deleteDocument(id, userId);

      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete document" });
      }

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
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

  const httpServer = createServer(app);

  return httpServer;
}
