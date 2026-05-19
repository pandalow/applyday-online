import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'

// Utility normalization functions
const WS = /\s+/g
const MULTI_US = /_+/g

function toSnake(s: string): string {
  return s.trim().toLowerCase().replace(WS, '_').replace(/-/g, '_').replace(/\//g, '_').replace(MULTI_US, '_').replace(/^_+|_+$/g, '')
}

function dedupeSort(items: string[]): string[] {
  const seen = new Map<string, string>()
  for (const item of items) {
    const key = toSnake(item)
    seen.set(key, key)
  }
  return [...seen.values()].sort()
}

const LEVEL_MAP: Record<string, string> = {
  'entry-level': 'junior', 'graduate': 'junior', 'sr': 'senior', 'senior-level': 'senior', 'team lead': 'lead'
}

const ROLE_MAP: Record<string, string> = {
  react: 'frontend', flutter: 'frontend', web: 'fullstack', cloud: 'cloud_engineer',
  mobile: 'mobile_engineer', frontend: 'frontend', 'front-end': 'frontend',
  backend: 'backend', 'back-end': 'backend', fullstack: 'fullstack', 'full stack': 'fullstack',
  ml: 'data_scientist', 'machine learning': 'data_scientist', ai: 'data_scientist',
  'artificial intelligence': 'data_scientist', data: 'data_scientist',
  qa: 'qa_engineer', test: 'qa_engineer', devops: 'devops',
  software: 'software_engineer', application: 'software_engineer', sde: 'software_engineer',
}

function normalizeRole(text: string): string {
  const t = text.toLowerCase()
  for (const [key, val] of Object.entries(ROLE_MAP)) {
    if (t.includes(key)) return val
  }
  return toSnake(text)
}

// JD extraction schema (mirrors Python Pydantic model)
const JDSchema = z.object({
  company: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager']).nullable().optional(),
  location: z.string().nullable().optional(),
  employment_type: z.enum(['full_time', 'contract', 'internship', 'part_time']).nullable().optional(),
  salary_eur_min: z.number().nullable().optional(),
  salary_eur_max: z.number().nullable().optional(),
  bonus_percent: z.number().nullable().optional(),
  benefits: z.array(z.string()).default([]),
  years_experience_min: z.number().int().nullable().optional(),
  years_experience_max: z.number().int().nullable().optional(),
  education_required: z.string().nullable().optional(),
  responsibilities: z.array(z.string()).default([]),
  required_core_skills: z.array(z.string()).default([]),
  desirable_skills: z.array(z.string()).default([]),
  programming_languages: z.array(z.string()).default([]),
  frameworks_tools: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  cloud_platforms: z.array(z.string()).default([]),
  api_protocols: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
  mobile_technologies: z.array(z.string()).default([]),
  domain_keywords: z.array(z.string()).default([]),
  remote_work: z.enum(['on-site', 'hybrid', 'remote']).nullable().optional(),
  work_permit_required: z.boolean().nullable().optional(),
  visa_sponsorship: z.boolean().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  contact_email_or_phone: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  language_requirements: z.array(z.string()).default([]),
})

export type ExtractedJD = z.infer<typeof JDSchema>

const ARRAY_FIELDS = [
  'benefits', 'responsibilities', 'required_core_skills', 'desirable_skills',
  'programming_languages', 'frameworks_tools', 'databases', 'cloud_platforms',
  'api_protocols', 'methodologies', 'mobile_technologies', 'domain_keywords',
  'language_requirements',
] as const

function normalizeExtracted(raw: ExtractedJD): ExtractedJD {
  const result = { ...raw }

  // Normalize arrays
  for (const field of ARRAY_FIELDS) {
    const arr = (result as Record<string, unknown>)[field]
    if (Array.isArray(arr)) {
      (result as Record<string, unknown>)[field] = dedupeSort(arr.map(String))
    }
  }

  if (result.role) result.role = normalizeRole(result.role)
  if (result.level) {
    const mapped = LEVEL_MAP[result.level.toLowerCase()]
    if (mapped) result.level = mapped as ExtractedJD['level']
  }
  if (result.industry) result.industry = toSnake(result.industry)

  return result
}

function getLLM() {
  const provider = process.env.AI_PROVIDER ?? 'openai'
  const modelName = process.env.AI_MODEL ?? 'gpt-4o-mini'
  const temperature = parseFloat(process.env.AI_TEMPERATURE ?? '0')

  if (provider === 'openai') {
    return new ChatOpenAI({ model: modelName, temperature, timeout: 120_000, maxRetries: 2 })
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}

const EXTRACT_PROMPT = new PromptTemplate({
  template: `You are an information extractor. Extract job information from the following JD as JSON.
Rules:
- level: one of intern, junior, mid, senior, lead, manager
- employment_type: one of full_time, contract, internship, part_time
- remote_work: one of on-site, hybrid, remote
- salary_eur_min/max: numeric euros (no k suffix)
- location: "City, Country" format
- all skill/benefits fields: array of strings
- Return ONLY valid JSON matching this schema exactly:
{{
  "company": string|null, "role": string|null, "level": string|null,
  "location": string|null, "employment_type": string|null,
  "salary_eur_min": number|null, "salary_eur_max": number|null,
  "bonus_percent": number|null, "benefits": string[],
  "years_experience_min": number|null, "years_experience_max": number|null,
  "education_required": string|null, "responsibilities": string[],
  "required_core_skills": string[], "desirable_skills": string[],
  "programming_languages": string[], "frameworks_tools": string[],
  "databases": string[], "cloud_platforms": string[],
  "api_protocols": string[], "methodologies": string[],
  "mobile_technologies": string[], "domain_keywords": string[],
  "remote_work": string|null, "work_permit_required": boolean|null,
  "visa_sponsorship": boolean|null, "contact_person": string|null,
  "contact_email_or_phone": string|null, "industry": string|null,
  "language_requirements": string[]
}}

JD:
{jd_text}`,
  inputVariables: ['jd_text'],
})

export async function extractJobDescription(jdText: string): Promise<ExtractedJD> {
  const model = getLLM()
  const prompt = await EXTRACT_PROMPT.format({ jd_text: jdText })
  const response = await model.invoke(prompt)

  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const parsed = JSON.parse(cleaned)
  const validated = JDSchema.parse(parsed)
  return normalizeExtracted(validated)
}
