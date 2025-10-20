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

  // Document upload endpoint
  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Convert file to base64 for OpenAI Vision API
      const base64Image = file.buffer.toString('base64');

      // Analyze document with OpenAI
      const analysisResult = await analyzeDocument(base64Image);

      // Upload file to object storage
      const { filePath, thumbnailPath } = await uploadFile(
        file.buffer,
        file.originalname,
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
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Failed to upload document",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

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
      const objectStorageService = new ObjectStorageService();

      // Get the object file
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

      // Get userId from session if authenticated
      const userId = req.user?.claims?.sub;

      // Check ACL permissions
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Stream the file to the response
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Object not found" });
      }
      console.error("Error serving object:", error);
      res.status(500).json({ message: "Failed to serve object" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
