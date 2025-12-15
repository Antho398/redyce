-- Script de migration pour mettre à jour TEMPLATE_MEMOIRE vers MODELE_MEMOIRE
-- À exécuter manuellement si nécessaire

-- 1. Mettre à jour les documents existants
UPDATE documents 
SET "documentType" = 'MODELE_MEMOIRE' 
WHERE "documentType" = 'TEMPLATE_MEMOIRE';

-- 2. Vérifier qu'il n'y a plus de TEMPLATE_MEMOIRE
SELECT COUNT(*) as remaining_count 
FROM documents 
WHERE "documentType" = 'TEMPLATE_MEMOIRE';

