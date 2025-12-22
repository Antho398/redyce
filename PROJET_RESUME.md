# Résumé objectif du projet Redyce

## Contexte général

Redyce est une application web Next.js (TypeScript) pour la génération assistée par IA de mémoires techniques dans le contexte des appels d'offres BTP. L'application permet aux utilisateurs de :

1. Télécharger un template mémoire (DOCX ou PDF) contenant des questions
2. Extraire automatiquement les questions du template via IA
3. Générer des réponses aux questions via IA en utilisant les documents de contexte (AO, DPGF, CCTP, etc.)
4. Exporter un mémoire technique rempli avec injection automatique des réponses dans le DOCX

## Architecture technique

- **Framework** : Next.js 14+ avec App Router
- **Base de données** : PostgreSQL avec Prisma ORM
- **IA** : OpenAI API (GPT-4o-mini pour l'extraction, GPT-4-turbo pour la génération)
- **Client IA** : `@/lib/ai/client` avec lazy initialization pour garantir le chargement des variables d'environnement

## Flow principal de l'application

Le flow principal suit un parcours linéaire :

1. **Documents** → Upload du template mémoire (DOCX recommandé) + documents de contexte (AO, DPGF, etc.)
2. **Questions extraites** → Extraction automatique des questions via IA, révision et édition
3. **Mémoire technique** → Création et remplissage du mémoire avec génération IA des réponses
4. **Exports** → Export DOCX avec injection automatique des réponses

La page **Aperçu** est une vue dashboard en dehors du flow principal.

## Fonctionnalités principales

### Gestion des documents

- Upload de template mémoire (DOCX ou PDF) - DOCX recommandé pour l'injection automatique
- Upload de documents de contexte (AO, RC, CCAP, CCTP, DPGF, AUTRE)
- Extraction automatique des exigences depuis les documents de contexte (analyse asynchrone)
- Gestion des types de documents avec possibilité de modification après upload

### Extraction des questions

- Extraction automatique des questions du template mémoire via IA
- Détection des sections, sous-sections et questions individuelles
- Support des formulaires entreprise (détection automatique)
- Édition manuelle des questions extraites (titre, statut obligatoire/optionnel)
- Suppression de questions individuelles ou par section

### Génération du mémoire technique

- Création de mémoires techniques associés à un template et un projet
- Système de versions pour les mémoires
- Génération IA des réponses aux questions en utilisant les documents de contexte
- Édition manuelle des réponses avec autosave
- Statuts de sections : Brouillon, À relire, Relu, Validé
- Système de commentaires et validation collaboratifs

### Export DOCX

- Export avec injection automatique des réponses dans le template DOCX
- Détection des placeholders dans le document
- Rapport d'injection détaillé (réponses injectées, manquantes, erreurs)
- Support PDF (copier-coller manuel requis)

### Gestion des exigences

- Extraction automatique des exigences depuis les documents (tous types)
- Tableau avec filtres (statut, catégorie, recherche)
- Statuts : À traiter, Couverte, Supprimée (corbeille)
- Actions en masse : marquer comme couverte, remettre à traiter, supprimer
- Pagination serveur pour gérer de gros volumes

### Bibliothèque de mémoires

- Vue globale de tous les mémoires techniques de tous les projets
- Filtres par statut et recherche
- Suppression de mémoires avec confirmation

## Structure des données principales

### Modèles Prisma

- **Project** : Projets utilisateur
- **Document** : Documents uploadés (template mémoire, documents de contexte)
  - `documentType` : MODELE_MEMOIRE, AE, RC, CCAP, CCTP, DPGF, AUTRE
  - `requirementStatus` : WAITING, PROCESSING, DONE, ERROR (pour le suivi de l'extraction d'exigences)
- **MemoryTemplate** : Template mémoire associé à un projet
- **TemplateQuestion** : Questions extraites du template
- **Memoire** : Mémoires techniques créés
- **MemoireSection** : Sections/réponses du mémoire
- **Requirement** : Exigences extraites des documents
  - `status` : A_TRAITER, COUVERTE, SUPPRIMEE
  - `category` : Exigence technique, Exigence financière, etc.

## Services principaux

- **memory-template-service.ts** : Gestion des templates mémoire et extraction des questions
- **memory-template-parser-ai.ts** : Extraction IA des questions depuis DOCX/PDF
- **technical-memo-service.ts** : Gestion des mémoires techniques (création, versions, sections)
- **requirement-extraction-job.ts** : Extraction des exigences depuis les documents
- **docx-injection-service.ts** : Injection des réponses dans les templates DOCX
- **section-ai-service.ts** : Génération IA des réponses aux sections

## Points d'attention techniques

### Extraction des questions

L'extraction utilise un prompt IA détaillé qui détecte :
- Les formulaires entreprise
- Les sections/ITEMS/CHAPITRES
- Les questions (texte, OUI/NON, sous-questions conditionnelles)
- La hiérarchie des questions

Le texte est limité à 20000 caractères pour l'analyse IA.

### Injection DOCX

- Détection des placeholders `{{Q_<questionId>}}` dans le document
- Remplacement par les réponses validées
- Gestion des réponses manquantes ([À compléter])
- Rapport d'injection détaillé

### Extraction des exigences

- Extraction automatique lors de l'upload de documents
- Utilisation de `setImmediate()` pour traitement asynchrone non bloquant
- Suivi du statut via `document.requirementStatus`
- Hash de contenu pour éviter les doublons

## État actuel et évolutions récentes

- ✅ Système de jobs supprimé (retour au traitement synchrone/asynchrone via `setImmediate()`)
- ✅ Extraction automatique des exigences pour tous les types de documents
- ✅ Injection automatique des réponses dans DOCX
- ✅ Pagination serveur pour les exigences
- ✅ Actions en masse pour les exigences
- ✅ Bibliothèque de mémoires avec suppression
- 🔄 Extraction des questions : optimisation en cours pour améliorer la précision
