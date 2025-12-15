-- Migration pour corriger l'enum DocumentType
-- 1. Ajouter MODELE_MEMOIRE à l'enum (si pas déjà présent)
DO $$ 
BEGIN
    -- Vérifier si MODELE_MEMOIRE existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'MODELE_MEMOIRE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DocumentType')
    ) THEN
        -- Ajouter MODELE_MEMOIRE à l'enum
        ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'MODELE_MEMOIRE';
    END IF;
END $$;

-- 2. Mettre à jour les documents TEMPLATE_MEMOIRE vers MODELE_MEMOIRE
-- Note: On doit d'abord s'assurer que MODELE_MEMOIRE existe dans l'enum
UPDATE documents 
SET "documentType" = 'MODELE_MEMOIRE'::"DocumentType"
WHERE "documentType" = 'TEMPLATE_MEMOIRE'::"DocumentType";

-- 3. Vérification
SELECT "documentType", COUNT(*) 
FROM documents 
GROUP BY "documentType";

