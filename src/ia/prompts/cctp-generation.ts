/**
 * Prompts spécialisés pour la génération de CCTP
 */

export const CCTP_GENERATION_SYSTEM_PROMPT = `Tu es un expert en rédaction de CCTP (Cahier des Clauses Techniques Particulières) pour les appels d'offres de construction et rénovation.

Un CCTP doit:
- Être clair, précis et complet
- Répondre aux exigences du DPGF
- Structurer les prescriptions techniques par lots ou par articles
- Inclure les normes et référentiels applicables
- Définir les critères de conformité et de réception

Tu dois générer un CCTP professionnel, structuré et conforme aux pratiques du secteur.`

export interface CCTPGenerationPromptContext {
  projectName: string
  dpgfData: {
    titre?: string
    reference?: string
    articles?: Array<{
      numero: string
      titre: string
      prescriptions: string[]
      materiaux?: Array<{
        designation: string
        caracteristiques: Record<string, any>
      }>
    }>
    materiauxGeneraux?: Array<{
      designation: string
      caracteristiques: Record<string, any>
    }>
    normes?: string[]
  }
  userRequirements?: string
  additionalContext?: string
}

export function buildCCTPGenerationPrompt(context: CCTPGenerationPromptContext): string {
  const { projectName, dpgfData, userRequirements, additionalContext } = context

  // Formater les articles du DPGF
  const articlesText = dpgfData.articles
    ?.map(article => {
      let text = `\nArticle ${article.numero}: ${article.titre || 'Sans titre'}`
      if (article.prescriptions?.length > 0) {
        text += `\nPrescriptions:\n${article.prescriptions.map(p => `- ${p}`).join('\n')}`
      }
      if (article.materiaux?.length > 0) {
        text += `\nMatériaux:\n${article.materiaux.map(m => `- ${m.designation}: ${JSON.stringify(m.caracteristiques)}`).join('\n')}`
      }
      return text
    })
    .join('\n\n') || 'Aucun article spécifié'

  // Formater les matériaux généraux
  const materiauxText = dpgfData.materiauxGeneraux
    ?.map(m => `- ${m.designation}: ${JSON.stringify(m.caracteristiques)}`)
    .join('\n') || 'Aucun matériau général spécifié'

  // Formater les normes
  const normesText = dpgfData.normes?.join(', ') || 'Aucune norme spécifiée'

  return `Génère un CCTP (Cahier des Clauses Techniques Particulières) complet pour le projet: "${projectName}"

${dpgfData.reference ? `Référence DPGF: ${dpgfData.reference}\n` : ''}

**Données du DPGF source:**

Articles et prescriptions:
${articlesText}

Matériaux généraux:
${materiauxText}

Normes et référentiels:
${normesText}

${userRequirements ? `\n**Exigences spécifiques du projet:**\n${userRequirements}\n` : ''}

${additionalContext ? `\n**Contexte supplémentaire:**\n${additionalContext}\n` : ''}

**Structure attendue du CCTP:**

Génère un CCTP structuré en JSON avec la structure suivante:

{
  "projet": {
    "nom": "${projectName}",
    "reference": "Référence du projet",
    "lieu": "Lieu d'implantation"
  },
  "sections": [
    {
      "titre": "1. OBJET ET DOMAINE D'APPLICATION",
      "contenu": "Description détaillée de l'objet et du domaine d'application..."
    },
    {
      "titre": "2. PRESCRIPTIONS TECHNIQUES GÉNÉRALES",
      "contenu": "Prescriptions générales..."
    }
  ],
  "prescriptionsTechniques": [
    {
      "article": "Article 1.1",
      "titre": "Titre de l'article",
      "description": "Description détaillée",
      "exigences": [
        "Exigence 1",
        "Exigence 2"
      ],
      "materiaux": ["Liste des matériaux"],
      "normes": ["Références normes"],
      "critereReception": "Critères de réception des travaux"
    }
  ],
  "reception": {
    "conditions": "Conditions de réception",
    "documents": "Documents à fournir",
    "essais": "Essais et contrôles à effectuer"
  },
  "annexes": []
}

Le CCTP doit être complet, professionnel et directement utilisable pour un appel d'offres.`
}

