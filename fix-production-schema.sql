-- =====================================================
-- PRODUCTION DATABASE SCHEMA FIX
-- =====================================================
-- Fügt fehlende Spalten zur documents-Tabelle hinzu
-- SICHER: Löscht KEINE Daten, fügt nur neue Spalten hinzu
-- =====================================================

-- Schritt 1: payment_status Spalte hinzufügen (falls sie noch nicht existiert)
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
        
        RAISE NOTICE 'payment_status Spalte erfolgreich hinzugefügt';
    ELSE
        RAISE NOTICE 'payment_status Spalte existiert bereits';
    END IF;
END $$;

-- Schritt 2: payment_reminder_sent_at Spalte hinzufügen (falls sie noch nicht existiert)
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
        
        RAISE NOTICE 'payment_reminder_sent_at Spalte erfolgreich hinzugefügt';
    ELSE
        RAISE NOTICE 'payment_reminder_sent_at Spalte existiert bereits';
    END IF;
END $$;

-- Fertig! Keine Daten wurden gelöscht oder geändert.
SELECT 'Schema-Update abgeschlossen!' as status;
