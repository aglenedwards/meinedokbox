# PaperEase Design Guidelines

## Design Approach: Productivity-First System

**Selected Approach:** Design System (Material Design principles + Modern Productivity Apps)  
**Key References:** Google Drive, Notion, Dropbox - focused on clean information hierarchy, efficient workflows, and mobile-first interaction patterns  
**Core Principle:** Minimize friction in document capture and retrieval; maximize clarity in organization

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary Brand: 37 82% 58% (Professional blue - trust and reliability)
- Surface: 0 0% 100% (Pure white backgrounds)
- Surface Secondary: 220 14% 96% (Subtle gray for cards/panels)
- Text Primary: 222 47% 11% (Deep blue-gray)
- Text Secondary: 215 16% 47% (Medium gray)
- Success: 142 76% 36% (Document successfully processed)
- Border: 220 13% 91% (Subtle dividers)

**Dark Mode:**
- Primary Brand: 37 82% 65% (Slightly lighter for contrast)
- Surface: 222 47% 11% (Deep blue-gray background)
- Surface Secondary: 217 33% 17% (Elevated cards)
- Text Primary: 210 40% 98% (Off-white)
- Text Secondary: 215 20% 65% (Light gray)
- Border: 217 33% 23% (Subtle dividers)

### B. Typography

**Font Families:**
- Primary: 'Inter' from Google Fonts - excellent readability, modern
- Monospace: 'JetBrains Mono' - for document IDs, metadata

**Scale:**
- Hero/Page Title: text-3xl md:text-4xl font-bold (36px/48px)
- Section Headers: text-xl md:text-2xl font-semibold (20px/24px)
- Card Titles: text-base font-medium (16px)
- Body Text: text-sm (14px)
- Metadata/Labels: text-xs text-secondary (12px)
- Button Text: text-sm font-medium (14px)

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Consistent padding: p-4 md:p-6 for containers
- Card spacing: p-6 with gap-4 between elements
- Section margins: mb-8 md:mb-12
- Grid gaps: gap-4 md:gap-6

**Container Strategy:**
- Mobile: px-4 (16px horizontal padding)
- Desktop: max-w-7xl mx-auto px-6 lg:px-8
- Content areas: max-w-4xl for focused reading

### D. Component Library

**Navigation:**
- Mobile: Bottom navigation bar with 4 icons (Upload, Documents, Search, Profile)
- Desktop: Left sidebar (240px) collapsible with clear category hierarchy
- Top bar: Logo, search input, user avatar - sticky on scroll

**Upload/Scan Interface:**
- Large central upload zone with dashed border and camera icon
- Two primary actions: "Scan Document" (camera) and "Upload File" (folder)
- Prominent, accessible buttons with min-height of 48px (mobile touch target)
- Preview modal with cropping/rotation controls before processing

**Document Cards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card structure: Thumbnail (aspect-video), title, metadata row, category badge
- Hover state: subtle shadow elevation (shadow-md to shadow-lg)
- Category badges: rounded-full px-3 py-1 text-xs with category-specific colors

**Folder/Category View:**
- Icon + Name + Document count
- Collapsible nested structure with visual indent
- Active category: subtle background tint with border-l-4 accent

**Search Interface:**
- Persistent search bar in header with icon prefix
- Real-time suggestions dropdown with highlighted matching text
- Filters: Date range, category, document type (chips below search)

**Loading States:**
- Document processing: Progress bar with percentage + status text
- Skeleton loaders for document grid (preserving layout)
- Subtle pulse animation for AI processing indicator

**Empty States:**
- Centered illustration (simple line art SVG)
- Clear action prompt: "Upload your first document"
- Secondary helper text explaining benefits

### E. Interactions & Microanimations

**Motion Philosophy:** Minimal and purposeful - only where it aids understanding

**Essential Animations:**
- Upload success: Check icon scale-in with green tint fade
- Document card hover: transform scale-[1.02] transition-transform
- Modal entry/exit: fade + scale from 95% to 100%
- Category expand/collapse: smooth height transition

**Prohibited:** Unnecessary page transitions, flashy effects, decorative animations

---

## Page-Specific Guidelines

### Dashboard/Home
- Hero section: NO traditional hero - immediately show upload zone + recent documents
- Layout: Upload card (prominent, 1/3 width desktop) + Recent documents grid (2/3 width)
- Quick stats row: Total documents, Storage used, Documents this month (minimal cards)

### Document List View
- Toolbar: View toggle (grid/list), sort dropdown, filter button
- Grid: Document cards with thumbnails, 3-column desktop, 1-column mobile
- List: Compact rows with small thumbnail, title, metadata, actions icon
- Infinite scroll with "Load more" button fallback

### Upload Flow
1. Upload interface with drag-drop zone
2. Preview with adjustment controls
3. Processing indicator (AI analyzing...)
4. Success confirmation with detected category + option to override
5. Quick action: "Add another" or "View document"

### Search Results
- Grouped by category with count headers
- Highlighted matching text snippets from OCR
- Filter sidebar (desktop) or bottom sheet (mobile)

---

## Images & Assets

**Icons:** Heroicons (outline style for navigation, solid for actions)

**Document Thumbnails:**
- Generated from first page of document
- Fallback: Document type icon with category color background
- Aspect ratio: 4:3 with rounded corners (rounded-lg)

**Empty State Illustrations:**
- Simple, friendly line art
- Suggested: Document with checkmark, folder with sparkles
- Neutral gray color scheme matching text-secondary

**Logo/Branding:**
- Wordmark: "PaperEase" with document/paper icon
- Favicon: Stylized "P" or folded paper icon
- Color: Primary brand blue

---

## Mobile-Specific Considerations

- Bottom navigation always visible (fixed)
- FAB (Floating Action Button) for quick scan: bottom-right, 56x56px, primary color
- Swipe gestures: Left swipe on document card reveals delete/move actions
- Pull-to-refresh on document list
- Native camera integration with full-screen capture interface
- Thumb-friendly touch targets: minimum 44x44px

---

## Trust & Security Visual Language

- Lock icons for secure documents
- Subtle shield icon in header during upload
- "Encrypted" badge where appropriate
- Clear visual separation between user documents (personal folder structure)
- Professional color palette reinforcing reliability