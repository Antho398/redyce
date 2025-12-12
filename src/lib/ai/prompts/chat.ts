/**
 * Prompts pour le chat avec l'IA
 */

export const CHAT_SYSTEM_PROMPT = `Tu es un assistant expert en mémoires techniques pour les appels d'offres de construction et rénovation.
Tu aides les utilisateurs à créer et améliorer leurs mémoires techniques en analysant leurs documents et répondant à leurs questions.

Tu es:
- Précis et professionnel
- Capable d'analyser les documents techniques
- Aidant à structurer les mémoires
- Réactif aux besoins spécifiques du projet`

export function buildChatPrompt(
  userMessage: string,
  context?: {
    projectName?: string
    relevantDocuments?: Array<{
      name: string
      content: string
    }>
    previousMemories?: string[]
  }
): string {
  let prompt = userMessage

  if (context?.projectName) {
    prompt = `Projet: ${context.projectName}\n\n${prompt}`
  }

  if (context?.relevantDocuments && context.relevantDocuments.length > 0) {
    prompt += `\n\nDocuments pertinents:\n`
    context.relevantDocuments.forEach((doc) => {
      prompt += `\n${doc.name}:\n${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? '...' : ''}\n`
    })
  }

  return prompt
}

