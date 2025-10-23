# PaperEase - Intelligent Document Management System

## Overview

PaperEase is a web and mobile application that digitizes paper documents using smartphone cameras or file uploads. It leverages AI-powered OCR and semantic analysis to automatically categorize documents and organize them into appropriate digital folders. The application provides a modern, productivity-focused interface for efficient document capture, storage, and retrieval.

**Core Purpose:** Minimize friction in document capture and retrieval; maximize clarity in organization through AI-assisted categorization.

**Recent Updates (Oct 2025):**
- **DSGVO-Compliant Email/Password Authentication with Double Opt-in (Oct 23, 2025):**
  - ✅ Backend: Strong password validation (min 8 chars, uppercase, lowercase, number, special char)
  - ✅ Backend: Register endpoint requires firstName, lastName, password confirmation, privacy checkbox
  - ✅ Backend: Email verification system with 24-hour token expiry
  - ✅ Backend: sendVerificationEmail() function sends beautiful HTML verification emails
  - ✅ Backend: GET /api/auth/verify-email endpoint verifies tokens and activates accounts
  - ✅ Backend: Login blocked for non-verified users with helpful error message
  - ✅ Backend: **CRITICAL FIX** - isAuthenticated middleware now properly supports both OIDC and Local Auth users
  - ✅ Backend: **CRITICAL FIX** - Session persistence enforced with req.session.save() in login flow
  - ✅ Backend: Cookie settings optimized (secure/sameSite) for development and production environments
  - ✅ Frontend: Enhanced registration form with password confirmation, privacy checkbox, required name fields
  - ✅ Frontend: Password strength requirements displayed in placeholder
  - ✅ Frontend: Email verification page (/verify-email) with success/error states
  - ✅ Frontend: Post-registration flow shows email verification message instead of auto-login
  - ✅ Frontend: Login with refetchQueries ensures proper authentication state before redirect
  - ✅ Database: users.isVerified, users.verificationToken, users.verificationTokenExpiry fields added
  - ✅ **EMAIL/PASSWORD LOGIN FULLY FUNCTIONAL** - All authentication flows working in development and production
- **Folder-Based Privacy System (Oct 21, 2025):**
  - ✅ Backend: Folders table with `isShared` flag for granular privacy control
  - ✅ Backend: Shared users only see documents from folders marked as shared
  - ✅ Backend: Auto-migration creates default folders ("Alle Dokumente" shared, "Privat" private)
  - ✅ Frontend: Folder navigation UI in Dashboard with Lock/Share icons
  - ✅ Frontend: Documents filtered by selected folder
  - ✅ Frontend: Upload documents into selected folder
  - ⏳ Pending: Folder management UI in Settings (create, rename, delete, toggle sharing)
- **Phase 3 Mobile Excellence Completed:**
  - ✅ Kamera-Multi-Shot-Modus: Kontinuierliche Dokumentenaufnahme mit der Handykamera
  - ✅ Auto-Bildoptimierung: Automatische Schärfung, Helligkeit- und Kontrast-Anpassung
  - ✅ PWA-Support: Vollständig installierbare Progressive Web App
  - ✅ Offline-Fähigkeit: Service Worker mit intelligenten Caching-Strategien
  - ✅ Installations- und Update-Prompts: Benutzerfreundliche PWA-Verwaltung
- Added document viewer with full-screen display for images and PDFs
- Improved AI categorization to correctly classify Abrechnungen/Endabrechnungen as "Rechnung"
- Enhanced document cards with clickable preview functionality
- Download capability for all documents

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript, built using Vite as the build tool.

**UI Component System:** shadcn/ui components based on Radix UI primitives, styled with Tailwind CSS following the "New York" design variant.

**Design System:** Material Design principles combined with modern productivity app patterns (inspired by Google Drive, Notion, Dropbox). Focus on clean information hierarchy, efficient workflows, and mobile-first interaction patterns. Detailed color palette and typography specifications defined in `design_guidelines.md`.

**State Management:** TanStack Query (React Query) for server state management with optimistic updates and caching strategies.

**Routing:** Wouter for lightweight client-side routing.

**Theme Support:** Custom ThemeProvider component with light/dark mode toggle, persisted to localStorage.

**Key Design Decisions:**
- Mobile-first responsive design with breakpoint at 768px
- HSL-based color system with CSS custom properties for easy theming
- Consistent spacing using Tailwind's spacing scale (2, 4, 6, 8, 12, 16)
- Inter font family for readability, JetBrains Mono for metadata/IDs

### Backend Architecture

**Framework:** Express.js (Node.js) with TypeScript, using ES modules.

**API Structure:** RESTful API with modular route registration pattern. Main routes defined in `server/routes.ts`.

**File Upload Processing:**
- Multer middleware for handling multipart/form-data uploads
- Memory storage for immediate processing
- File type validation (JPEG, PNG, WEBP, PDF)
- 10MB file size limit

**Authentication:** Dual authentication system supporting both Replit Auth (OIDC) and Email/Password.
- **Replit Auth:** OpenID Connect (OIDC) integration using Passport.js Strategy
- **Email/Password:** Passport Local Strategy with bcrypt password hashing (SALT_ROUNDS=10)
- Session-based authentication with PostgreSQL session storage (express-session)
- 7-day session TTL
- User profile data stored in database upon first login or registration
- Users identified by `userId` format: Replit users have numeric IDs, local users have `local_` prefix

**Document Processing Pipeline:**
1. File upload received via Multer
2. OpenAI GPT-5 Vision API analyzes document image
3. AI extracts text (OCR), determines category, generates title, provides confidence score
   - Categories: Rechnung (includes bills, invoices, Abrechnungen), Vertrag, Versicherung, Brief, Sonstiges
   - Improved prompt ensures Endabrechnungen and Nebenkostenabrechnungen are classified as "Rechnung"
4. File and optional thumbnail stored in object storage
5. Document metadata saved to PostgreSQL database

**Document Viewing:**
- Documents accessible via `/objects/:objectPath` route with ACL-based access control
- Full-screen viewer modal for images and PDFs
- Download functionality for all document types
- Thumbnail previews in document cards

**Error Handling:** Centralized error middleware with status code and message extraction.

### Data Storage Solutions

**Primary Database:** PostgreSQL (via Neon serverless driver with WebSocket support).

**ORM:** Drizzle ORM for type-safe database queries and schema management.

**Database Schema:**
- `sessions` table: Express session storage with expiry indexing
- `users` table: User profiles from Replit Auth (email, name, profile image)
- `folders` table: Folder organization with privacy control (userId, name, isShared boolean)
- `documents` table: Document metadata (title, category, extracted text, file URLs, confidence score, upload timestamp, folderId for organization)
- `sharedAccess` table: Tracks which users have shared access to other users' documents

**Object Storage:** Google Cloud Storage integration via Replit Object Storage service.
- Presigned URL generation for secure file uploads
- Automatic path normalization
- Thumbnail generation for images using Sharp library (400x300, JPEG at 80% quality)
- ACL (Access Control List) system for granular permissions (read/write)

**Key Architectural Decisions:**
- Neon serverless PostgreSQL chosen for scalability and WebSocket support
- Drizzle ORM provides type safety without heavy abstraction
- Object storage separation keeps database lightweight and enables CDN optimization
- Session storage in PostgreSQL ensures consistency across server instances

### External Dependencies

**AI/ML Services:**
- **OpenAI API:** GPT-5 model for document analysis, OCR, and categorization
- Vision API endpoint for image-based document processing
- JSON-formatted responses for structured data extraction

**Cloud Infrastructure:**
- **Google Cloud Storage:** File and thumbnail storage via Replit Object Storage abstraction
- **Neon Database:** Serverless PostgreSQL hosting

**Authentication:**
- **Replit Auth:** OAuth/OIDC provider for user authentication
- Issuer URL: `https://replit.com/oidc`
- Token exchange via Replit sidecar endpoint (localhost:1106)

**Third-Party Libraries:**
- **Sharp:** Image processing and thumbnail generation
- **Multer:** File upload handling
- **Passport.js:** Authentication middleware
- **date-fns:** Date formatting and manipulation
- **Radix UI:** Headless UI component primitives
- **TanStack Query:** Server state management
- **Tailwind CSS:** Utility-first styling

**Development Tools:**
- **Vite:** Build tool with HMR and development server
- **TypeScript:** Type safety across client and server
- **Drizzle Kit:** Database migrations and schema management
- **ESBuild:** Server bundling for production

**Environment Requirements:**
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OIDC issuer endpoint (optional, defaults to Replit)