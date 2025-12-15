# 🔍 Audit de Code - Rapport de Taille et Code Mort

**Date**: 2024-12-16  
**Total lignes de code**: ~30 488 lignes (src/)  
**Nombre de fichiers**: 233 fichiers TypeScript/TSX

---

## 📊 Analyse Globale

### Taille du Projet
- **Lignes de code totales**: 30 488
- **Fichiers TypeScript/TSX**: 233
- **Fichiers les plus volumineux** (>400 lignes):
  1. `exigences/page.tsx` - 516 lignes
  2. `DocumentUpload.tsx` - 509 lignes
  3. `CCTPViewer.tsx` - 499 lignes
  4. `DPGFTableViewer.tsx` - 476 lignes
  5. `documents/page.tsx` - 468 lignes

---

## 🗑️ Code Mort / Fichiers à Supprimer

### 1. Fichiers `.old` (Non utilisés)
- ✅ **`src/services/memory-section-service.old.ts`** (354 lignes)
  - Aucune importation trouvée
  - Fichier de sauvegarde probablement obsolète
  - **Action**: Supprimer

### 2. Fichiers Stub / Non Implémentés (TODO uniquement)

Ces fichiers contiennent uniquement des stubs avec des `throw new Error('Not yet implemented')` :

#### Services Stub (248 lignes total)
- **`src/services/extraction-service.ts`** (~83 lignes)
  - Service d'extraction RenovIA non implémenté
  - Toutes les méthodes lancent `Not yet implemented`
  
- **`src/services/prompt-service.ts`** (~89 lignes)
  - Service de gestion des prompts Buildismart non implémenté
  - Toutes les méthodes lancent `Not yet implemented`

#### Extracteurs Stub (104 lignes total)
- **`src/lib/documents/extractors/cctp-extractor-enhanced.ts`** (52 lignes)
  - Extracteur CCTP RenovIA non implémenté
  
- **`src/lib/documents/extractors/dpgf-extractor-enhanced.ts`** (52 lignes)
  - Extracteur DPGF RenovIA non implémenté

#### Analyseurs Stub (88 lignes total)
- **`src/lib/documents/analyzers/structure-analyzer.ts`** (88 lignes)
  - Analyseur de structure non implémenté

#### Parser Stub (54 lignes total)
- **`src/lib/documents/parser/pdf-parser-enhanced.ts`** (54 lignes)
  - Parser PDF avancé non implémenté

#### Utilitaires IA Stub (~110 lignes)
- **`src/ia/utils/prompt-optimizer.ts`** (~110 lignes)
- **`src/ia/prompts/cctp-generation-enhanced.ts`**
- **`src/ia/prompts/dpgf-extraction-enhanced.ts`**
- **`src/ia/templates/cctp-template.ts`**

**Total Stub**: ~604 lignes de code non fonctionnel

### 3. Fichiers Potentiellement Inutilisés

- **`src/components/documents/TemplateWarningCard.tsx`** (74 lignes)
  - Aucune importation trouvée dans le codebase
  - Remplacé par `TemplateMemoireCard.tsx`
  - **Action**: Vérifier puis supprimer si confirmé

- **`src/components/documents/document-upload-helpers.ts`**
  - Fichier créé mais peut-être non utilisé
  - **Action**: Vérifier les imports

### 4. Fichiers Dupliqués / Versions Multiples

- **`src/services/memory-section-service.ts`** (354 lignes)
- **`src/services/memory-section-service-updated.ts`** (? lignes)
- **`src/services/memory-section-service.old.ts`** (354 lignes) ⚠️

  - 3 versions du même service
  - **Action**: Identifier laquelle est utilisée et supprimer les autres

---

## 📝 Documentation Excessive

### Fichiers MD à la racine (20+ fichiers)
- Beaucoup de fichiers de récapitulatifs/documentation
- Certains peuvent être consolidés ou déplacés dans `/docs`

**Exemples**:
- `API_SECURITY_RECAP.md`
- `API_SECURITY_SUMMARY.md`
- `COLLABORATION_RECAP.md`
- `COMPANY_PROFILE_RECAP.md`
- `INTEGRATION_STUBS_RECAP.md`
- `MEMOIRE_EDITOR_V1_RECAP.md`
- `MEMOIRE_EDITOR_V2_RECAP.md`
- `MEMOIRE_EXPORT_DOCX_RECAP.md`
- `MEMOIRE_VERSIONING_RECAP.md`
- `PRISMA_CHANGES_SUMMARY.md`
- `REQUIREMENTS_V2_RECAP.md`
- `STABILIZATION_V1_RECAP.md`
- `STABILIZATION_V1_SUMMARY.md`
- etc.

**Action recommandée**: 
- Garder uniquement `README_V1.md` et `TESTING_V1.md` à la racine
- Déplacer les autres dans `/docs/history/` ou `/docs/recaps/`

---

## 🔧 Code à Refactoriser

### Fichiers > 400 lignes (Doivent être découpés)

1. **`src/app/(dashboard)/projects/[id]/exigences/page.tsx`** (516 lignes)
   - À découper en sous-composants

2. **`src/components/documents/DocumentUpload.tsx`** (509 lignes)
   - À découper en hooks et sous-composants

3. **`src/components/cctp/CCTPViewer.tsx`** (499 lignes)
   - À découper en sous-composants

4. **`src/components/dpgf/DPGFTableViewer.tsx`** (476 lignes)
   - À découper en sous-composants

5. **`src/app/(dashboard)/documents/page.tsx`** (468 lignes)
   - À découper en sous-composants

6. **`src/app/(dashboard)/memoire/page.tsx`** (454 lignes)
   - À découper en sous-composants

7. **`src/services/technical-memo-service.ts`** (444 lignes)
   - Peut être découpé en sous-services

---

## 📊 Résumé des Économies Potentielles

| Catégorie | Lignes | Action |
|-----------|--------|--------|
| Fichiers `.old` | ~354 | Supprimer |
| Fichiers Stub non implémentés | ~604 | Supprimer ou implémenter |
| Documentation excessive | ~2000+ | Consolider/déplacer |
| Code mort potentiel | ~74 | Vérifier et supprimer |
| **TOTAL** | **~3032+ lignes** | **À nettoyer** |

**Pourcentage du codebase**: ~10% peut être nettoyé

---

## ✅ Recommandations d'Actions Immédiates

### Priorité 1 (Sûr à supprimer)
1. ✅ Supprimer `src/services/memory-section-service.old.ts`
2. ✅ Vérifier et supprimer `src/components/documents/TemplateWarningCard.tsx` si non utilisé
3. ✅ Consolider les fichiers MD en gardant uniquement l'essentiel

### Priorité 2 (À décider)
1. ⚠️ Décider du sort des fichiers stub (supprimer ou implémenter)
2. ⚠️ Identifier quelle version de `memory-section-service` utiliser
3. ⚠️ Refactoriser les fichiers > 400 lignes

### Priorité 3 (Amélioration continue)
1. 🔄 Découper les gros fichiers en sous-composants
2. 🔄 Améliorer la documentation (consolidation)

---

## 🎯 Conclusion

Le projet contient **~30 488 lignes**, ce qui est raisonnable pour une application SaaS BTP avec :
- Gestion de projets
- Upload/parsing de documents
- Éditeur de mémoires techniques
- Génération IA
- Système d'exigences
- Exports DOCX
- Versioning & collaboration

**Le code mort représente ~10%** (stubs, fichiers old, doc excessive), ce qui est gérable. Le reste du code semble actif et fonctionnel.

**Action recommandée**: Nettoyer les fichiers `.old` et les stubs non utilisés immédiatement pour améliorer la maintenabilité.

