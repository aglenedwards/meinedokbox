import { neon } from "@neondatabase/serverless";

/**
 * Auto-Migration: Fügt fehlende Spalten zur Production-Datenbank hinzu
 * Läuft automatisch beim Server-Start (Dev & Production)
 * SICHER: Fügt nur neue Spalten hinzu, löscht keine Daten
 */
export async function runAutoMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL not found - skipping auto-migrations");
    return;
  }

  console.log("🔄 Running auto-migrations...");
  
  const sql = neon(DATABASE_URL);

  try {
    // Migration 1: payment_status Spalte hinzufügen
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'documents' 
          AND column_name = 'payment_status'
        ) THEN
          ALTER TABLE documents 
          ADD COLUMN payment_status varchar(20) DEFAULT 'not_applicable';
          RAISE NOTICE 'payment_status Spalte hinzugefügt';
        END IF;
      END $$;
    `;

    // Migration 2: payment_reminder_sent_at Spalte hinzufügen
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'documents' 
          AND column_name = 'payment_reminder_sent_at'
        ) THEN
          ALTER TABLE documents 
          ADD COLUMN payment_reminder_sent_at timestamp[];
          RAISE NOTICE 'payment_reminder_sent_at Spalte hinzugefügt';
        END IF;
      END $$;
    `;

    // Migration 3: error_logs Tabelle erstellen
    await sql`
      CREATE TABLE IF NOT EXISTS "error_logs" (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        level varchar(10) NOT NULL DEFAULT 'error',
        message text NOT NULL,
        stack text,
        url text,
        method varchar(10),
        user_id varchar,
        status_code integer,
        duration_ms integer,
        metadata jsonb,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `;

    // Migration 4: Index auf error_logs.created_at für schnelle Zeitfilter
    await sql`
      CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at DESC);
    `;

    console.log("✅ Auto-migrations completed successfully");
  } catch (error) {
    console.error("❌ Auto-migration failed:", error);
    // Fehler nicht werfen - Server soll trotzdem starten
    // Falls Spalten bereits existieren, ist das kein kritischer Fehler
  }
}
