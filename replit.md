# PaperEase - Intelligent Document Management System

## Overview

PaperEase is a web and mobile application that digitizes paper documents using smartphone cameras or file uploads. It leverages AI-powered OCR and semantic analysis to automatically categorize documents and organize them into appropriate digital folders. The application provides a modern, productivity-focused interface for efficient document capture, storage, and retrieval.

**Core Purpose:** Minimize friction in document capture and retrieval; maximize clarity in organization through AI-assisted categorization.

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

**Authentication:** Replit Auth integration with OpenID Connect (OIDC) using Passport.js strategy.
- Session-based authentication with PostgreSQL session storage
- 7-day session TTL
- User profile data stored in database upon first login

**Document Processing Pipeline:**
1. File upload received via Multer
2. OpenAI GPT-5 Vision API analyzes document image
3. AI extracts text (OCR), determines category, generates title, provides confidence score
4. File and optional thumbnail stored in object storage
5. Document metadata saved to PostgreSQL database

**Error Handling:** Centralized error middleware with status code and message extraction.

### Data Storage Solutions

**Primary Database:** PostgreSQL (via Neon serverless driver with WebSocket support).

**ORM:** Drizzle ORM for type-safe database queries and schema management.

**Database Schema:**
- `sessions` table: Express session storage with expiry indexing
- `users` table: User profiles from Replit Auth (email, name, profile image)
- `documents` table: Document metadata (title, category, extracted text, file URLs, confidence score, upload timestamp)

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