-- Étape 2: Mettre à jour les documents TEMPLATE_MEMOIRE vers MODELE_MEMOIRE
UPDATE documents 
SET "documentType" = 'MODELE_MEMOIRE'::"DocumentType"
WHERE "documentType" = 'TEMPLATE_MEMOIRE'::"DocumentType";

-- Vérification
SELECT "documentType", COUNT(*) as count
FROM documents 
GROUP BY "documentType"
ORDER BY "documentType";

