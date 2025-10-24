# PaperEase - Intelligent Document Management System

## Overview

PaperEase is a web and mobile application designed to digitize paper documents using smartphone cameras or file uploads. It utilizes AI-powered OCR and semantic analysis for automatic document categorization and organization into digital folders. The application aims to provide a modern, productivity-focused interface for efficient document capture, storage, and retrieval, minimizing friction and maximizing clarity through AI assistance. The project ambitions include GDPR compliance with data stored in Germany and robust anti-abuse and family quota systems.

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
1. File upload via Multer (multipart/form-data, memory storage, type validation: JPEG, PNG, WEBP, PDF, 10MB limit).
2. OpenAI GPT-5 Vision API for OCR, category determination (Rechnung, Vertrag, Versicherung, Brief, Sonstiges), title generation, and confidence scoring. Improved AI classification for specific document types.
3. File and optional thumbnail stored in IONOS S3 Object Storage.
4. Document metadata saved to PostgreSQL.

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