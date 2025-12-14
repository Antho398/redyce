# Checklist de nettoyage du repo Redyce

## 🔴 Fichiers/Dossiers à NE JAMAIS versionner

### ❌ Actuellement versionnés (à retirer de git)

1. **`.env.old`** 
   - Fichier d'environnement ancien
   - Action: `git rm --cached .env.old`

2. **`uploads/.gitkeep` + contenu uploads/**
   - Le dossier uploads est dans .gitignore mais un fichier PDF est présent
   - Fichier trouvé: `uploads/c22a1caa-595d-4870-8c89-1f42b2e8de07.pdf`
   - Action: Vérifier si des fichiers uploads/ sont trackés et les retirer

3. **`next-env.d.ts`**
   - Généré automatiquement par TypeScript/Next.js
   - Action: Ajouter à .gitignore si nécessaire

4. **`package-lock.json` (8,129 lignes)**
   - Débat: certains projets le gardent, d'autres non
   - Si équipe utilise npm → garder
   - Si équipe utilise yarn/pnpm → considérer retirer
   - Action: Décider en équipe

### ✅ Déjà dans .gitignore (vérifier qu'ils ne sont pas trackés)

- `.next/` ✅
- `node_modules/` ✅
- `uploads/` ✅
- `.env` ✅
- `build/` ✅
- `dist/` ✅
- `prisma/migrations/` ✅ (mais migrations sont trackées - normal)

---

## 🔍 Duplications probables

### Composants UI
- Structure unique: `src/components/ui/` (16 fichiers)
- Pas de duplication détectée

### Hooks
- Structure unique: `src/hooks/` (8 fichiers)
- Pas de duplication détectée dans les noms

### Pages
- Structure app router standard: `src/app/(dashboard)/...`
- Pas de duplication évidente

### À vérifier manuellement
- Comparer les composants de `src/components/cctp/` et `src/components/dpgf/` pour logique similaire
- Vérifier les viewers pour code dupliqué

---

## 📊 Top 20 fichiers les plus volumineux

1. **`package-lock.json`** - 8,129 lignes
   - ⚠️ Normal mais volumineux

2. **`DESIGN_GUIDE.md`** - 636 lignes
   - 📝 Documentation

3. **`UI_ROLLOUT_RECAP.md`** - 556 lignes
   - 📝 Documentation

4. **`TESTS_E2E.md`** - 553 lignes
   - 📝 Documentation

5. **`ARCHITECTURE.md`** - 530 lignes
   - 📝 Documentation

6. **`src/app/(dashboard)/projects/[id]/documents/page.tsx`** - 522 lignes
   - ⚠️ Page volumineuse - considérer extraire des composants

7. **`INTEGRATION_RENOVIA_BUILDISMART.md`** - 519 lignes
   - 📝 Documentation

8. **`API_IMPLEMENTATION_RECAP.md`** - 502 lignes
   - 📝 Documentation

9. **`src/components/cctp/CCTPViewer.tsx`** - 499 lignes
   - ⚠️ Composant volumineux

10. **`src/app/(dashboard)/projects/[id]/memoire/[memoireId]/page.tsx`** - 477 lignes
    - ⚠️ Page volumineuse

11. **`src/components/dpgf/DPGFTableViewer.tsx`** - 476 lignes
    - ⚠️ Composant volumineux

12. **`src/components/documents/DocumentUpload.tsx`** - 458 lignes
    - ⚠️ Composant volumineux

13. **`src/app/(dashboard)/memoire/page.tsx`** - 454 lignes
    - ⚠️ Page volumineuse

14. **`src/app/(dashboard)/documents/page.tsx`** - 446 lignes
    - ⚠️ Page volumineuse

15. **`src/app/(dashboard)/projects/[id]/exigences/page.tsx`** - 444 lignes
    - ⚠️ Page volumineuse

16. **`prisma/schema.prisma`** - 435 lignes
    - ✅ Normal pour un schéma Prisma

17. **`src/components/dpgf/DPGFViewer.tsx`** - 432 lignes
    - ⚠️ Composant volumineux

18. **`src/services/technical-memo-service.ts`** - 411 lignes
    - ⚠️ Service volumineux

19. **`src/components/cctp/CCTPSplitViewer.tsx`** - 398 lignes
    - ⚠️ Composant volumineux

20. **`src/services/requirement-service.ts`** - 379 lignes
    - ⚠️ Service volumineux

---

## 📋 Actions recommandées

### Priorité 1 - Sécurité/Propreté

- [ ] **Retirer `.env.old` du repo**
  ```bash
  git rm --cached .env.old
  git commit -m "Remove .env.old from version control"
  ```

- [ ] **Vérifier fichiers uploads/ trackés**
  ```bash
  git ls-files uploads/
  # Si fichiers présents (sauf .gitkeep), les retirer
  git rm --cached uploads/*.pdf uploads/*.docx uploads/*.jpg (etc.)
  ```

- [ ] **Vérifier que .gitignore couvre tous les fichiers sensibles**
  - Ajouter `next-env.d.ts` si nécessaire
  - Vérifier `*.log`, `*.cache`

### Priorité 2 - Documentation

- [ ] **Consolidation des fichiers MD** (60+ fichiers .md dans le root)
  - Créer un dossier `docs/` ou `documentation/`
  - Déplacer les fichiers de recap/guide
  - Garder uniquement README.md et peut-être quelques guides essentiels à la racine

- [ ] **Archiver les recaps anciens**
  - Les fichiers `*_RECAP.md` peuvent être archivés
  - Garder uniquement les guides actifs

### Priorité 3 - Refactoring (optionnel)

- [ ] **Découper les gros composants**
  - `CCTPViewer.tsx` (499 lignes) → extraire sous-composants
  - `DPGFTableViewer.tsx` (476 lignes) → extraire sous-composants
  - `DocumentUpload.tsx` (458 lignes) → extraire logique métier

- [ ] **Découper les pages volumineuses**
  - `documents/page.tsx` (522 lignes) → extraire composants
  - `memoire/[memoireId]/page.tsx` (477 lignes) → extraire sections

- [ ] **Évaluer package-lock.json**
  - Si équipe utilise npm → garder
  - Si équipe utilise yarn → considérer retirer et utiliser yarn.lock

### Priorité 4 - Optimisation

- [ ] **Vérifier taille du repo git**
  - Analyser `.git/` si volumineux
  - Considérer `git gc` pour optimiser

- [ ] **Nettoyer historique si nécessaire**
  - Si fichiers sensibles ont été commités dans l'historique
  - Utiliser `git filter-branch` ou `git filter-repo` (attention!)

---

## 📝 Notes

- **Total lignes trackées**: ~47,525 lignes
- **Fichiers .md**: 60+ fichiers de documentation
- **Structure**: Globalement propre, quelques fichiers volumineux à considérer pour refactoring
- **Sécurité**: `.env.old` à retirer impérativement

---

## 🎯 Actions immédiates recommandées

1. ✅ Retirer `.env.old` du versioning
2. ✅ Vérifier aucun fichier uploads/ n'est tracké (sauf .gitkeep)
3. ✅ Consolider les fichiers MD dans `docs/`
4. ⏸️ Décider sur `package-lock.json` (garder si npm, retirer si yarn/pnpm)

