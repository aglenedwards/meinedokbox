# Doklify - Intelligent Document Management System

## Overview

Doklify (formerly MeineDokBox) is a web and mobile application designed to digitize paper documents using smartphone cameras or file uploads. It leverages AI-powered OCR and semantic analysis for automatic document categorization and organization into digital folders. The application aims to provide a modern, productivity-focused interface for efficient document capture, storage, and retrieval, minimizing friction and maximizing clarity through AI assistance. The project's ambitions include GDPR compliance with data stored in Germany and robust anti-abuse and family quota systems.

## Rebrand Notes

- **Old brand:** MeineDokBox / meinedokbox.de
- **New brand:** Doklify / doklify.de
- **Admin email:** service@doklify.de
- **Inbound email domain:** in.doklify.de (DNS must be updated in Mailgun)
- **S3 bucket env var default:** `doklify-production` (actual bucket rename is external — update `IONOS_S3_BUCKET` env var on Render)
- **Stripe webhooks:** Must be updated to point to `https://doklify.de/api/stripe/webhook`
- **Old domain redirect:** Set up 301 redirect from meinedokbox.de → doklify.de for 6–12 months
- **Logo asset:** Logo image file `meinedokbox_1760966015056.png` retained as-is; only alt text and brand labels updated. Replace with new Doklify logo when available.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Frameworks & Libraries:** React with TypeScript, Vite, shadcn/ui (Radix UI + Tailwind CSS), Wouter for routing, TanStack Query for state management.

**Design System:** Material Design principles combined with modern productivity app patterns, focusing on clean information hierarchy, efficient workflows, and mobile-first interactions. This includes a mobile-first responsive design, HSL-based color system with CSS custom properties, consistent spacing, and the Inter font family.

**Key Features:**
- Full PWA support with offline capabilities and intelligent caching, including dedicated PWA login screen and iOS safe area handling.
- Dynamic theme support with light/dark mode.
- Document viewer with full-screen display for images and PDFs.
- Enhanced document cards with clickable previews and download functionality.
- Kamera-Multi-Shot-Modus for continuous document capture.
- Auto-Bildoptimierung for image enhancement.
- Image compression on upload with WebP conversion and dimension limits.
- Multi-upload enhancements including increased file limits, file counters, and automatic PDF merging.
- Referral dashboard for users to track their referrals and rewards.
- Unsubscribe landing page and resubscribe option for marketing emails.
- Non-dismissible PaywallModal for new users: 3-plan tabs (Solo/Familie/Familie Pro), timeline visualization, annual-only pricing with 7-day trial, redirects to Stripe Checkout.
- Dashboard auto-refresh every 30 seconds + manual refresh button for documents.
- Umzugspaket (migration budget): one-time upload quota per plan (Solo: 500, Familie: 1.000, Familie Pro: 2.000) consumed before the monthly quota. Activated via Stripe webhook on first subscription. Shared across all family members (stored on master). Dashboard shows two separate cards — Erstimport and monthly. Displayed in PaywallModal per plan and in Settings usage section.

### Backend Architecture

**Frameworks & Libraries:** Express.js (Node.js) with TypeScript, ES modules.

**API Structure:** RESTful API with modular route registration.

**Authentication:** Dual system supporting Replit Auth (OIDC via Passport.js) and Email/Password (Passport Local Strategy with bcrypt, double opt-in email verification). Session-based authentication uses PostgreSQL for storage with a 7-day TTL.

**Document Processing Pipeline:**
1. File upload via Multer (multipart/form-data, memory storage, type validation: JPEG, PNG, WEBP, PDF, 10MB limit, max 10 files per upload).
2. OpenAI GPT-5 Vision API for OCR and intelligent categorization across 15 categories with priority-based rules. Categories are enhanced with comprehensive German/English keywords and specific rules for medical invoices, government documents, and utility bills. Rate limiting and retry logic are implemented for OpenAI API calls.
3. Optional: Multiple files can be merged into a single PDF document using pdf-lib before processing.
4. File and optional thumbnail stored in IONOS S3 Object Storage.
5. Document metadata saved to PostgreSQL with extracted data (title, date, amount, sender, tags).

**Data Management:**
- **Hybrid Limit System:** Monthly upload quotas and total storage limits per user, shared across family members.
- **Dynamic Slave Plan Synchronization:** Slave accounts dynamically inherit the Master's subscription plan and limits. Protection ensures Slaves become independent Masters with a trial period upon removal.
- **Token-Based Invitation System:** Secure token generation for inviting new users, facilitating automatic linking to master accounts upon registration.
- **Folder-Based Privacy System:** Granular control over document visibility with shared/private folder options, including automatic sharing for "Steuererklärung" folders with partners.
- **Referral Tracking System:** Tracks referral codes, referred users, bonus storage, and eligibility for free plans based on active paying referrals.
- **Email Marketing & Reactivation System:** Tracks all sent marketing emails, integrates with Mailgun webhooks for event tracking (delivered, opened, clicked, unsubscribed), and includes a post-trial reactivation email cron job with a 3-step sequence.

**Error Handling:** Centralized middleware for robust error management.

### Data Storage Solutions

**Primary Database:** PostgreSQL (Neon serverless driver) managed with Drizzle ORM for type-safe queries.

**Database Schema:** Includes `sessions`, `users`, `folders`, `documents`, `sharedAccess`, `referrals`, and `marketingEmails` tables.

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
- **Mailgun:** Email sending and tracking.

**Authentication:**
- **Replit Auth:** OIDC provider for user authentication.

**Payment Processing:**
- **Stripe:** For subscription management and webhook integration to track referral activation and churn.

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
- **pdf-lib:** PDF manipulation (merging).
