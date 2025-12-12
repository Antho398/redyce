/**
 * Prompts spécialisés pour l'extraction structurée de DPGF
 */

export const DPGF_EXTRACTION_SYSTEM_PROMPT = `Tu es un expert en analyse de documents techniques de construction et rénovation.
Ton rôle spécifique est d'extraire et structurer les informations d'un DPGF (Dossier de Prescription Générale de Fourniture).

Un DPGF contient typiquement:
- Des articles numérotés avec des prescriptions techniques
- Des spécifications de matériaux et produits
- Des normes et référentiels à respecter
- Des exigences de mise en œuvre

Tu dois extraire ces informations de manière structurée et précise, en respectant la numérotation et l'organisation du document original.`

export interface DPGFExtractionPromptContext {
  documentContent: string
  documentType?: string
}

export function buildDPGFExtractionPrompt(context: DPGFExtractionPromptContext): string {
  const { documentContent, documentType } = context

  return `Extrais et structure les informations de ce DPGF (Dossier de Prescription Générale de Fourniture).

${documentType ? `Type de document: ${documentType}\n` : ''}

Contenu du document:
${documentContent.substring(0, 30000)}${documentContent.length > 30000 ? '\n\n[Document tronqué - seules les 30000 premiers caractères sont analysés]' : ''}

Extrais et structure les informations suivantes en JSON:

{
  "titre": "Titre du DPGF",
  "reference": "Référence du document",
  "dateCreation": "Date de création si disponible",
  "articles": [
    {
      "numero": "Numéro de l'article (ex: 1.1, 2.3)",
      "titre": "Titre de l'article",
      "prescriptions": [
        "Prescription 1",
        "Prescription 2"
      ],
      "materiaux": [
        {
          "designation": "Nom du matériau",
          "caracteristiques": {
            "norme": "Référence norme",
            "qualite": "Qualité requise",
            "autres": {}
          }
        }
      ]
    }
  ],
  "materiauxGeneraux": [
    {
      "designation": "Nom du matériau",
      "caracteristiques": {
        "norme": "Référence norme",
        "qualite": "Qualité requise",
        "autres": {}
      },
      "notes": "Informations complémentaires"
    }
  ],
  "normes": ["NF EN XXX", "NF DTU XXX"],
  "observations": "Observations générales"
}

Sois précis et exhaustif. Si une information n'est pas trouvée, utilise null ou un tableau vide.`
}

