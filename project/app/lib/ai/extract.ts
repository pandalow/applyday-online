import { PromptTemplate } from '@langchain/core/prompts'
import { jsonrepair } from 'jsonrepair'
import { z } from 'zod'
import { createLLM } from '@/app/lib/ai/llm'
import type { AIProvider } from '@/app/lib/aiConfig'

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
  // Engineering
  react: 'frontend', flutter: 'frontend', 'front-end': 'frontend', frontend: 'frontend',
  'back-end': 'backend', backend: 'backend',
  'full stack': 'fullstack', fullstack: 'fullstack', web: 'fullstack',
  mobile: 'mobile_engineer', cloud: 'cloud_engineer',
  ml: 'data_scientist', 'machine learning': 'data_scientist',
  ai: 'data_scientist', 'artificial intelligence': 'data_scientist',
  qa: 'qa_engineer', test: 'qa_engineer', devops: 'devops',
  software: 'software_engineer', sde: 'software_engineer',
  // Data & Analytics
  'data engineer': 'data_engineer', 'data analyst': 'data_analyst',
  'data scientist': 'data_scientist', analytics: 'analyst', analyst: 'analyst',
  // Product & Design
  'product manager': 'product_manager', 'product owner': 'product_manager',
  ux: 'ux_designer', 'ui designer': 'ui_designer', designer: 'designer',
  // Business functions
  marketing: 'marketing', 'growth': 'marketing',
  sales: 'sales', 'account executive': 'sales', 'account manager': 'sales',
  finance: 'finance', accounting: 'finance', 'financial analyst': 'finance',
  'human resource': 'hr', recruiter: 'recruiter', 'talent acquisition': 'recruiter',
  operations: 'operations', 'project manager': 'project_manager',
  legal: 'legal', compliance: 'legal', security: 'security',
  'customer success': 'customer_success', 'customer support': 'support',
  content: 'content', copywriter: 'content',
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

function getLLM(provider: AIProvider, apiKey: string, model: string, reasoning: boolean) {
  return createLLM(provider, apiKey, model, reasoning)
}

const EXTRACT_PROMPT = new PromptTemplate({
  template: `You are a precise job description parser. Extract structured data from the JD below.
This parser handles ALL job types — engineering, marketing, finance, HR, design, operations, sales, legal, etc.

## Field rules

**Enums (use exactly these values):**
- level: intern | junior | mid | senior | lead | manager  (infer from context if not explicit)
- employment_type: full_time | contract | internship | part_time
- remote_work: on-site | hybrid | remote
- industry: single lowercase word/phrase (finance, healthcare, gaming, saas, e-commerce, logistics, retail, media, consulting, etc.)

**Salary:** convert to EUR integers, no suffix (50000 not "50k"); null if absent.
**location:** "City, Country" format; null if fully remote.

**Skill categorisation — mutually exclusive, apply to ALL role types:**
- required_core_skills: ALL must-have qualifications for the role — include both hard skills (financial modelling, SEO, data analysis, system design) and soft skills (stakeholder management, team leadership, written communication). Use for any role type. Short phrases, not sentences.
- desirable_skills: ONLY items explicitly labelled optional / nice-to-have / plus / bonus / preferred.
- frameworks_tools: named tools, platforms, or software required — for tech roles: React, Docker, Kubernetes; for non-tech roles: Salesforce, HubSpot, Tableau, Figma, SAP, Excel, Google Analytics, Jira, Asana, etc. Any named tool counts.
- programming_languages: ONLY coding languages — Python, JavaScript, SQL, R, etc. Leave empty for non-technical roles unless coding is required.
- cloud_platforms: AWS, GCP, Azure, and similar. Typically empty for non-tech roles.
- databases: any data store — PostgreSQL, MongoDB, Snowflake, etc. Typically empty for non-tech roles.
- api_protocols: REST, GraphQL, gRPC, OAuth2, etc. Typically empty for non-tech roles.
- methodologies: work methodologies — Agile, Scrum, OKR, Six Sigma, Lean, PRINCE2, CI/CD, etc.
- mobile_technologies: React Native, Flutter, Swift, Kotlin, etc. Only for mobile-focused roles.
- domain_keywords: business/domain signals — fintech, B2B, SaaS, marketplace, high-growth, enterprise, D2C, regulated, startup, etc.
- benefits: explicit perks — health insurance, flexible hours, stock options, remote-first, learning budget, etc.
- responsibilities: short imperative phrases 3–8 words each — e.g. ["Manage paid media campaigns", "Build financial models", "Mentor junior engineers"]
- language_requirements: spoken/written natural languages only if explicitly required — English, German, Mandarin, etc.

Return ONLY valid JSON:
{{
  "company": string|null, "role": string|null, "level": string|null,
  "location": string|null, "employment_type": string|null, "industry": string|null,
  "salary_eur_min": number|null, "salary_eur_max": number|null, "bonus_percent": number|null,
  "years_experience_min": number|null, "years_experience_max": number|null,
  "education_required": string|null, "remote_work": string|null,
  "work_permit_required": boolean|null, "visa_sponsorship": boolean|null,
  "contact_person": string|null, "contact_email_or_phone": string|null,
  "responsibilities": string[],
  "required_core_skills": string[], "desirable_skills": string[],
  "programming_languages": string[], "frameworks_tools": string[],
  "databases": string[], "cloud_platforms": string[],
  "api_protocols": string[], "methodologies": string[],
  "mobile_technologies": string[], "domain_keywords": string[],
  "benefits": string[], "language_requirements": string[]
}}

JD:
{jd_text}`,
  inputVariables: ['jd_text'],
})

export async function extractJobDescription(
  jdText: string,
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4o-mini',
  reasoning = false,
): Promise<ExtractedJD> {
  const model = getLLM(provider, apiKey, modelId, reasoning)
  const prompt = await EXTRACT_PROMPT.format({ jd_text: jdText })
  const response = await model.invoke(prompt)

  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const parsed = JSON.parse(jsonrepair(cleaned))
  const validated = JDSchema.parse(parsed)
  return normalizeExtracted(validated)
}
