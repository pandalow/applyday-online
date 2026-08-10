import { jsonrepair } from 'jsonrepair'
import { z } from 'zod'
import { createLLM } from '@/app/lib/ai/llm'
import type { AIProvider } from '@/app/lib/aiConfig'

const SuggestionSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    type: z.enum(['keyword_gap', 'quantify', 'reframe', 'add_section']),
    section: z.string(),
    original: z.string().optional(),
    text: z.string(),
    reason: z.string(),
  })),
})

export type GeneratedSuggestion = z.infer<typeof SuggestionSchema>['suggestions'][number]

function fmt(arr: string[] | null | undefined): string {
  if (!arr?.length) return 'N/A'
  return arr.slice(0, 15).join(', ')
}

const PROMPT_TEMPLATE = `You are an expert resume coach. Compare the candidate's resume against a specific job description and generate targeted improvement suggestions.

LANGUAGE: Write ALL text values ("text", "reason", "original") in {language}. JSON keys must remain in English.

Focus on actionable, specific changes. Each suggestion must fall into one of these types:
- keyword_gap: A skill/keyword in the JD is missing from the resume (add it)
- quantify: A bullet point in the resume lacks metrics/numbers (add measurable impact)
- reframe: An existing experience should be reworded to better match the JD language/priorities
- add_section: The resume is missing an entire section that would help (e.g., certifications, projects)

Rules:
- Generate 5–10 suggestions maximum, prioritised by impact
- For "original" field: quote the exact resume text being improved (skip for keyword_gap/add_section)
- For "text" field: provide the exact replacement or addition — something the candidate can copy-paste
- Be specific, not generic. Reference actual content from both the JD and resume.

Job Description:
Role: {role}
Company: {company}
Required skills: {required_skills}
Desirable skills: {desirable_skills}
Tools & frameworks: {frameworks_tools}
Key responsibilities: {responsibilities}
Domain keywords: {domain_keywords}

Resume (full text):
{resume_text}

Return ONLY valid JSON in this exact shape:
{{
  "suggestions": [
    {{
      "id": "1",
      "type": "keyword_gap",
      "section": "Skills",
      "text": "Add 'Terraform' to your infrastructure skills",
      "reason": "The JD mentions Terraform 3 times as a required tool; it is absent from your resume"
    }},
    {{
      "id": "2",
      "type": "quantify",
      "section": "Work Experience",
      "original": "Improved the CI/CD pipeline to reduce deployment times",
      "text": "Reduced deployment time from ~45 min to 8 min by redesigning the CI/CD pipeline, enabling 3x faster release cycles",
      "reason": "JD emphasises operational efficiency; quantified impact makes this bullet significantly stronger"
    }}
  ]
}}`

export async function generateResumeSuggestions(
  resume: { text: string },
  jd: {
    role?: string | null
    company?: string | null
    requiredCoreSkills?: string[] | null
    desirableSkills?: string[] | null
    frameworksTools?: string[] | null
    responsibilities?: string[] | null
    domainKeywords?: string[] | null
  },
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4o-mini',
  reasoning = false,
  language: 'en' | 'zh' = 'en',
): Promise<GeneratedSuggestion[]> {
  const model = createLLM(provider, apiKey, modelId, reasoning)

  const langLabel = language === 'zh' ? 'Chinese (Simplified)' : 'English'

  const prompt = PROMPT_TEMPLATE
    .replace('{language}', langLabel)
    .replace('{role}', jd.role ?? 'N/A')
    .replace('{company}', jd.company ?? 'N/A')
    .replace('{required_skills}', fmt(jd.requiredCoreSkills))
    .replace('{desirable_skills}', fmt(jd.desirableSkills))
    .replace('{frameworks_tools}', fmt(jd.frameworksTools))
    .replace('{responsibilities}', fmt(jd.responsibilities))
    .replace('{domain_keywords}', fmt(jd.domainKeywords))
    .replace('{resume_text}', resume.text.slice(0, 20000))

  const response = await model.invoke(prompt)
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = SuggestionSchema.parse(JSON.parse(jsonrepair(cleaned)))
  return parsed.suggestions
}
