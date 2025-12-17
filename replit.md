# PaperEase - Intelligent Document Management System

## Overview

PaperEase is a web and mobile application designed to digitize paper documents using smartphone cameras or file uploads. It utilizes AI-powered OCR and semantic analysis for automatic document categorization and organization into digital folders. The application aims to provide a modern, productivity-focused interface for efficient document capture, storage, and retrieval, minimizing friction and maximizing clarity through AI assistance. The project ambitions include GDPR compliance with data stored in Germany and robust anti-abuse and family quota systems.

## Recent Changes

### December 17, 2025 - SmartFolder Partner Sharing & Slave Protection

**Steuererklärung Tab Auto-Sharing:**
- Added `shareWithPartner` boolean field to SmartFolders schema
- When enabled, all documents in the SmartFolder are automatically visible to partners
- No need to manually toggle `isShared` on each individual document
- Partners bypass the `isShared` filter when viewing SmartFolders with shareWithPartner=true
- Toggle only visible to users who have linked partners (Master/Slave accounts)
- Green Users icon indicates documents shared via folder setting (vs blue for manually shared)
- Disabled manual sharing toggle on documents when shareWithPartner is active

**Slave Protection on Removal:**
- When a Master revokes/removes a Slave from their family account, the Slave is not deleted
- Slave automatically becomes an independent Master with their own account
- Slave receives a 7-day trial period to choose their own subscription plan
- All documents belonging to the Slave are preserved
- Email notification sent to the Slave explaining the change and their options
- Same protection applies during plan downgrade (when max users is reduced)

### December 15, 2025 - Image Compression, Rate Limiting & Code Optimization

**OpenAI API Rate Limiting:**
- Implemented Semaphore-based concurrency limiter (max 5 parallel API calls)
- Added retry logic with exponential backoff for 429/503 errors (3 retries, starting at 1s)
- Request throttling with 200ms minimum interval between API calls
- Wrapped all OpenAI API calls: analyzeDocument(), analyzeDocumentFromText(), searchDocuments()
- Prevents API quota exhaustion during high-concurrency scenarios

**Image Compression on Upload:**
- Implemented automatic WebP conversion for all uploaded images (JPEG, PNG, WEBP)
- Max dimension limit: 2000px (maintains aspect ratio)
- Quality setting: 85% (optimal balance between size and quality)
- PDFs remain unchanged (no compression needed)
- Significantly reduces storage costs and improves loading times

**Code Quality Improvements:**
- Centralized category configuration in `shared/categories.ts`
- Removed duplicate categoryConfig from DocumentCard.tsx and CategoryFilter.tsx
- Added helper functions: `getCategoryConfig()`, `getCategoryBadgeClasses()`, `getCategoryBorderColor()`
- Verified all useEffect hooks have proper cleanup functions (no memory leaks)

### October 26, 2025 - AI Classification Improvements & Multi-Upload Enhancement

**AI Document Categorization Overhaul:**
- Completely revised all 15 category descriptions with comprehensive keywords and examples
- Added explicit medical invoice recognition: "Gesundheit & Arzt" now includes Arztrechnungen, Krankenhausrechnung, Zahnarztrechnung, Apothekenrechnung, Dermatologie, Physiotherapie
- Implemented priority-based categorization rules to prevent misclassification:
  1. Medical invoices (with terms like Behandlung, Diagnose, Arzt, Therapie) → "Gesundheit & Arzt"
  2. Government invoices → "Behörden & Amtliches"
  3. Tax-related invoices → "Steuern & Buchhaltung"
  4. Utility bills → "Wohnen & Immobilien"
  5. Retail purchases → "Einkäufe & Online-Bestellungen"
- Enhanced all categories with German and English keywords for improved recognition
- Added specific document types: insurance renewal letters, parking tickets, student certificates, daycare invoices, etc.

**Multi-Upload Enhancements:**
- Increased upload limit from 5 to 10 files per batch
- Added file counter display (x/10 files selected)
- Implemented "merge into one document" checkbox for combining multiple PDFs/images
- Added automatic PDF merging capability using pdf-lib
- Enhanced progress indicator showing current file being processed
- Improved user feedback with specific merge confirmation messages

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Frameworks & Libraries:** React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS), Wouter for routing, TanStack Query for state management.

**Design System:** Material Design principles combined with modern productivity app patterns, focusing on clean information hierarchy, efficient workflows, and mobile-first interactions. Features include a mobile-first responsive design, HSL-based color system with CSS custom properties, consistent spacing, and the Inter font family.

**Key Features:**
- Full PWA support with offline capabilities and intelligent caching.
- Dynamic theme support with light/dark mode.
- Document viewer with full-screen display for images and PDFs.
- Enhanced document cards with clickable previews and download functionality.
- Kamera-Multi-Shot-Modus for continuous document capture.
- Auto-Bildoptimierung for image enhancement.

### Backend Architecture

**Frameworks & Libraries:** Express.js (Node.js) with TypeScript, ES modules.

**API Structure:** RESTful API with modular route registration.

**Authentication:** Dual system supporting Replit Auth (OIDC via Passport.js) and Email/Password (Passport Local Strategy with bcrypt, double opt-in email verification). Session-based authentication uses PostgreSQL for storage with a 7-day TTL.

**Document Processing Pipeline:**
1. File upload via Multer (multipart/form-data, memory storage, type validation: JPEG, PNG, WEBP, PDF, 10MB limit, max 10 files per upload).
2. OpenAI GPT-5 Vision API for OCR and intelligent categorization across 15 categories with priority-based rules:
   - Categories: Finanzen & Banken, Versicherungen, Steuern & Buchhaltung, Arbeit & Gehalt, Verträge & Abos, Behörden & Amtliches, Gesundheit & Arzt, Wohnen & Immobilien, Auto & Mobilität, Schule & Ausbildung, Familie & Kinder, Rente & Vorsorge, Einkäufe & Online-Bestellungen, Reisen & Freizeit, Sonstiges / Privat
   - Enhanced with comprehensive German/English keywords and priority rules for medical invoices, government documents, utility bills
3. Optional: Multiple files can be merged into a single PDF document using pdf-lib before processing
4. File and optional thumbnail stored in IONOS S3 Object Storage.
5. Document metadata saved to PostgreSQL with extracted data (title, date, amount, sender, tags).

**Data Management:**
- **Hybrid Limit System:** Monthly upload quotas and total storage limits per user, shared across family members.
- **Dynamic Slave Plan Synchronization:** Slave accounts dynamically inherit the Master's subscription plan and limits.
- **Token-Based Invitation System:** Secure token generation for inviting new users, facilitating automatic linking to master accounts upon registration.
- **Folder-Based Privacy System:** Granular control over document visibility with shared/private folder options.

**Error Handling:** Centralized middleware for robust error management.

### Data Storage Solutions

**Primary Database:** PostgreSQL (Neon serverless driver) managed with Drizzle ORM for type-safe queries.

**Database Schema:** Includes `sessions`, `users`, `folders`, `documents`, and `sharedAccess` tables.

**Object Storage:** IONOS S3 Object Storage (Frankfurt, Germany) for files and thumbnails. Features include presigned URL generation, path normalization, Sharp for thumbnail generation (400x300 JPEG), and an ACL system using S3 metadata.

### System Design Choices

- IONOS S3 for GDPR compliance and cost optimization.
- Neon serverless PostgreSQL for scalability.
- Drizzle ORM for type safety and lightweight abstraction.
- Separation of object storage from the database for efficiency and CDN optimization.
- Robust security measures including strong password policies, token-based invitations, and email verification.

## External Dependencies

**AI/ML Services:**
- **OpenAI API:** GPT-5 for document analysis, OCR, and categorization.

**Cloud Infrastructure:**
- **IONOS S3 Object Storage:** Primary storage for documents and thumbnails.
- **Neon Database:** Serverless PostgreSQL hosting.

**Authentication:**
- **Replit Auth:** OIDC provider for user authentication.

**Third-Party Libraries:**
- **@aws-sdk/client-s3 & @aws-sdk/s3-request-presigner:** IONOS S3 integration.
- **Sharp:** Image processing and thumbnail generation.
- **Multer:** File upload handling.
- **Passport.js:** Authentication middleware.
- **date-fns:** Date manipulation.
- **Radix UI:** Headless UI components.
- **TanStack Query:** Server state management.
- **Tailwind CSS:** Utility-first styling.
- **bcrypt:** Password hashing.

**Development Tools:**
- **Vite:** Build tool.
- **TypeScript:** Language.
- **Drizzle Kit:** Database migrations.
- **ESBuild:** Server bundling.