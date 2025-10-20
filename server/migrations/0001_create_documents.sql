CREATE TABLE IF NOT EXISTS "documents" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "extracted_text" text NOT NULL,
  "file_url" text NOT NULL,
  "thumbnail_url" text,
  "confidence" real NOT NULL,
  "uploaded_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "documents" ("user_id");
CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "documents" ("category");
CREATE INDEX IF NOT EXISTS "documents_uploaded_at_idx" ON "documents" ("uploaded_at");
