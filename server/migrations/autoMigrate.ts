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

    console.log("✅ Auto-migrations completed successfully");
  } catch (error) {
    console.error("❌ Auto-migration failed:", error);
    // Fehler nicht werfen - Server soll trotzdem starten
    // Falls Spalten bereits existieren, ist das kein kritischer Fehler
  }
}
