/**
 * Prompts pour la génération de mémoires techniques
 * À adapter selon les besoins spécifiques de Buildismart
 */

export const MEMORY_GENERATION_SYSTEM_PROMPT = `Tu es un expert en génération de mémoires techniques pour les appels d'offres de construction et rénovation.
Ton rôle est de créer des mémoires techniques détaillés, structurés et professionnels en analysant les documents fournis (CCTP, DPGF, RC, CCAP).

Critères importants:
- Structure claire et professionnelle
- Référence précise aux documents sources
- Langage technique approprié
- Réponses complètes aux exigences du projet
- Mise en forme professionnelle`

export function buildMemoryGenerationPrompt(context: {
  projectName: string
  documents: Array<{
    name: string
    type: string
    summary?: string
  }>
  userRequirements?: string
}): string {
  const documentsList = context.documents
    .map((doc) => `- ${doc.name} (${doc.type})${doc.summary ? `\n  ${doc.summary}` : ''}`)
    .join('\n')

  return `Génère un mémoire technique complet pour le projet "${context.projectName}".

Documents disponibles:
${documentsList}

${context.userRequirements ? `\nExigences spécifiques:\n${context.userRequirements}\n` : ''}

Structure attendue:
1. Présentation du projet
2. Analyse des besoins
3. Solution technique proposée
4. Références et compétences
5. Planning et organisation
6. Conclusion

Génère un mémoire détaillé et professionnel répondant à toutes les exigences du projet.`
}

