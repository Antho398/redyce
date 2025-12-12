/**
 * Prompts pour l'analyse de documents
 */

export const DOCUMENT_ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en analyse de documents techniques pour les appels d'offres.
Ton rôle est d'extraire et structurer les informations clés des documents (CCTP, DPGF, RC, CCAP).

Tu dois:
- Identifier les sections importantes
- Extraire les exigences techniques
- Structurer les informations de manière claire
- Identifier les points critiques`

export function buildExtractionPrompt(documentType: string, content: string): string {
  return `Analyse ce document ${documentType} et extrais les informations clés.

Contenu du document:
${content.substring(0, 10000)}${content.length > 10000 ? '...\n[Document tronqué]' : ''}

Fournis une analyse structurée avec:
1. Résumé exécutif
2. Exigences techniques principales
3. Contraintes et spécificités
4. Informations administratives importantes
5. Points d'attention`
}

export function buildSummaryPrompt(content: string, maxLength: number = 500): string {
  return `Résume ce document technique en ${maxLength} mots maximum, en conservant les informations les plus importantes:

${content.substring(0, 20000)}${content.length > 20000 ? '...\n[Document tronqué]' : ''}`
}

export function buildQAPrompt(content: string, questions: string[]): string {
  return `Réponds aux questions suivantes en te basant sur le document technique fourni:

Document:
${content.substring(0, 15000)}${content.length > 15000 ? '...\n[Document tronqué]' : ''}

Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Pour chaque question, fournis une réponse précise avec référence à la section du document si applicable.`
}

