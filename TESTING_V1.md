# Testing Guide - Redyce V1

## Scénarios clés à tester manuellement

### 1. Création et gestion de projet

#### Test 1.1 : Créer un projet
- [ ] Aller sur `/projects`
- [ ] Cliquer "Nouveau projet"
- [ ] Remplir nom + description
- [ ] Créer le projet
- [ ] Vérifier redirection vers la page projet
- [ ] Vérifier que le projet apparaît dans la liste

#### Test 1.2 : Projet vide (sans documents)
- [ ] Créer un projet
- [ ] Aller sur "Documents"
- [ ] Vérifier le message "Aucun document"
- [ ] Vérifier qu'on peut uploader un document

### 2. Upload et gestion de documents

#### Test 2.1 : Upload document avec type
- [ ] Aller sur `/projects/[id]/documents`
- [ ] Uploader un document PDF ou DOCX
- [ ] Sélectionner un type (AE, RC, CCAP, CCTP, DPGF, MODELE_MEMOIRE, AUTRE)
- [ ] Vérifier que le document apparaît dans la liste avec le bon type
- [ ] Vérifier que le badge "Template mémoire" s'affiche si type = MODELE_MEMOIRE

#### Test 2.2 : Upload template mémoire obligatoire
- [ ] Créer un projet
- [ ] Aller sur "Mémoire technique" → "Nouveau mémoire"
- [ ] Vérifier le message d'erreur "Aucun modèle de mémoire trouvé"
- [ ] Uploader un document de type MODELE_MEMOIRE
- [ ] Retourner créer un mémoire → doit fonctionner

### 3. Mémoire technique

#### Test 3.1 : Créer un mémoire
- [ ] Projet avec MODELE_MEMOIRE uploadé
- [ ] Aller sur "Mémoire technique" → "Nouveau mémoire"
- [ ] Vérifier que le template est sélectionné
- [ ] Entrer un titre
- [ ] Créer le mémoire
- [ ] Vérifier redirection vers l'éditeur
- [ ] Vérifier que les sections sont générées

#### Test 3.2 : Éditer une section
- [ ] Ouvrir un mémoire dans l'éditeur
- [ ] Sélectionner une section à gauche
- [ ] Écrire du contenu dans l'éditeur
- [ ] Vérifier l'indicateur "Enregistré" après quelques secondes
- [ ] Recharger la page → vérifier que le contenu est conservé

#### Test 3.3 : Mémoire sans sections (cas limite)
- [ ] Créer un mémoire (si possible avec template qui ne parse pas)
- [ ] Vérifier le message d'erreur clair si aucune section
- [ ] Vérifier qu'on peut toujours naviguer

### 4. IA sectionnelle

#### Test 4.1 : Générer avec contexte complet
- [ ] Projet avec documents sources (AE, RC, etc.)
- [ ] Profil entreprise complété
- [ ] Ouvrir un mémoire, sélectionner une section
- [ ] Ouvrir le panneau IA (si disponible)
- [ ] Cliquer "Compléter"
- [ ] Vérifier le loader pendant la génération
- [ ] Vérifier que la proposition utilise le contexte (nom entreprise, documents)
- [ ] Vérifier les citations affichées

#### Test 4.2 : Générer sans contexte suffisant
- [ ] Projet sans documents sources
- [ ] Profil entreprise vide
- [ ] Utiliser l'IA
- [ ] Vérifier le message d'erreur clair "Contexte insuffisant"
- [ ] Vérifier les suggestions (uploader documents, compléter profil)

#### Test 4.3 : Générer avec profil entreprise seulement
- [ ] Projet sans documents
- [ ] Profil entreprise complété
- [ ] Utiliser l'IA
- [ ] Vérifier que ça fonctionne (avec warning si nécessaire)

### 5. Exigences

#### Test 5.1 : Extraire des exigences
- [ ] Projet avec documents sources (AE, RC, CCAP, CCTP, DPGF)
- [ ] Aller sur "Exigences"
- [ ] Cliquer "Analyser le dossier"
- [ ] Vérifier le loader pendant l'extraction
- [ ] Vérifier que les exigences apparaissent dans le tableau
- [ ] Vérifier les colonnes : Exigence, Priorité, Statut, Source

#### Test 5.2 : Projet sans documents (extraction)
- [ ] Projet vide
- [ ] Aller sur "Exigences"
- [ ] Cliquer "Analyser le dossier"
- [ ] Vérifier le message d'erreur clair "Aucun document source disponible"

#### Test 5.3 : Lier exigence à section
- [ ] Ouvrir une exigence (clic)
- [ ] Cliquer "Lier à une section du mémoire"
- [ ] Sélectionner une section
- [ ] Vérifier que le lien est créé
- [ ] Vérifier l'affichage dans la colonne "Liée à"

### 6. Export DOCX

#### Test 6.1 : Export complet
- [ ] Mémoire avec plusieurs sections complétées
- [ ] Aller sur "Exports"
- [ ] Cliquer "Générer DOCX"
- [ ] Vérifier le loader
- [ ] Vérifier le toast de succès
- [ ] Télécharger le DOCX
- [ ] Ouvrir le fichier → vérifier le contenu (sections, titres, réponses)

#### Test 6.2 : Export partiel (sections vides)
- [ ] Mémoire avec quelques sections vides
- [ ] Générer l'export
- [ ] Vérifier le message d'avertissement "Export partiel"
- [ ] Télécharger et vérifier que les sections vides sont indiquées

#### Test 6.3 : Export sans template
- [ ] Mémoire sans template (cas limite)
- [ ] Essayer d'exporter
- [ ] Vérifier le message d'erreur clair "Aucun modèle de mémoire trouvé"

### 7. Versioning

#### Test 7.1 : Créer une nouvelle version
- [ ] Ouvrir un mémoire V1
- [ ] Modifier quelques sections
- [ ] Cliquer "Nouvelle version"
- [ ] Vérifier que V1 est figée
- [ ] Vérifier redirection vers V2
- [ ] Vérifier que le contenu est cloné

#### Test 7.2 : Modifier une version figée
- [ ] Aller sur une version figée
- [ ] Vérifier le badge "Figé"
- [ ] Essayer de modifier une section
- [ ] Vérifier le message d'erreur "Cannot modify frozen memo"

#### Test 7.3 : Comparer deux versions
- [ ] Depuis V2, cliquer "Comparer"
- [ ] Vérifier la modal avec comparaison
- [ ] Vérifier les badges "Inchangé" / "Modifié"
- [ ] Vérifier l'affichage côte à côte

### 8. Collaboration

#### Test 8.1 : Ajouter un membre
- [ ] En tant que OWNER
- [ ] Appeler API `POST /api/projects/[id]/members` avec userId et role (CONTRIBUTOR)
- [ ] Vérifier que le membre apparaît dans la liste

#### Test 8.2 : Permissions CONTRIBUTOR
- [ ] Se connecter avec un compte CONTRIBUTOR
- [ ] Ouvrir un mémoire
- [ ] Vérifier qu'on peut éditer les sections
- [ ] Vérifier qu'on peut commenter
- [ ] Vérifier qu'on NE PEUT PAS valider (bouton absent)

#### Test 8.3 : Permissions REVIEWER
- [ ] Se connecter avec un compte REVIEWER
- [ ] Ouvrir un mémoire
- [ ] Vérifier qu'on peut commenter
- [ ] Vérifier qu'on peut valider (bouton présent)
- [ ] Valider une section → vérifier le badge "Validé"

#### Test 8.4 : Commentaires
- [ ] Ouvrir une section
- [ ] Ajouter un commentaire
- [ ] Vérifier l'affichage
- [ ] Répondre à un commentaire
- [ ] Vérifier que la réponse s'affiche en dessous

### 9. Profil entreprise

#### Test 9.1 : Compléter le profil
- [ ] Aller sur `/settings/company-profile`
- [ ] Remplir le formulaire
- [ ] Sauvegarder
- [ ] Vérifier que les données sont conservées

#### Test 9.2 : Utiliser le profil dans l'IA
- [ ] Profil complété
- [ ] Utiliser l'IA pour générer une section
- [ ] Vérifier que le nom de l'entreprise apparaît dans la réponse

#### Test 9.3 : Warning si profil vide
- [ ] Profil vide ou inexistant
- [ ] Ouvrir l'éditeur d'un mémoire
- [ ] Vérifier le warning "Profil entreprise non complété"

### 10. Cas limites et robustesse

#### Test 10.1 : Projet sans documents
- [ ] Créer un projet
- [ ] Vérifier qu'on peut naviguer normalement
- [ ] Vérifier les messages d'empty state appropriés

#### Test 10.2 : Mémoire sans sections
- [ ] Cas limite (si possible)
- [ ] Vérifier qu'on peut toujours naviguer
- [ ] Vérifier le message d'erreur clair

#### Test 10.3 : Documents sans analyse
- [ ] Uploader un document
- [ ] Si l'analyse échoue
- [ ] Vérifier que le document reste visible
- [ ] Vérifier le statut "error" si applicable

#### Test 10.4 : Export avec gros volume
- [ ] Mémoire avec beaucoup de sections (10+)
- [ ] Toutes complétées avec du contenu
- [ ] Générer l'export
- [ ] Vérifier que ça fonctionne sans timeout

## Checklist avant démo

### Préparation
- [ ] Base de données propre (reset si nécessaire)
- [ ] Variables d'environnement configurées (.env)
- [ ] OPENAI_API_KEY configurée
- [ ] Serveur Next.js lancé et fonctionnel

### Données de test
- [ ] Au moins 2 projets créés
- [ ] Documents uploadés dans chaque projet (AE, RC, MODELE_MEMOIRE)
- [ ] Au moins 1 mémoire créé avec sections complétées
- [ ] Profil entreprise complété
- [ ] Au moins 1 export DOCX généré

### Vérifications techniques
- [ ] Aucune erreur dans la console du serveur
- [ ] Aucune erreur dans la console du navigateur
- [ ] Toutes les routes API répondent correctement
- [ ] Les permissions sont bien vérifiées
- [ ] Les messages d'erreur sont clairs (pas de stacktraces)

### Scénarios de démo
- [ ] Créer un projet en direct
- [ ] Uploader un document
- [ ] Créer un mémoire
- [ ] Éditer une section
- [ ] Utiliser l'IA pour compléter
- [ ] Extraire des exigences
- [ ] Générer un export DOCX
- [ ] Télécharger l'export

### Points d'attention
- [ ] Les loaders sont visibles pendant les opérations longues
- [ ] Les messages d'erreur sont compréhensibles
- [ ] Les empty states sont clairs
- [ ] La navigation est fluide
- [ ] Pas de crash côté serveur

