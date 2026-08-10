import { jsonrepair } from 'jsonrepair'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { createLLM } from '@/app/lib/ai/llm'
import type { AIProvider } from '@/app/lib/aiConfig'

const OKRSchema = z.object({
  objectives: z.array(z.object({
    timeframe: z.string(),
    objective: z.string(),
    keyResults: z.array(z.string()),
  })),
  interviewPrepTips: z.array(z.string()),
})

export type OKRContent = z.infer<typeof OKRSchema>

const OKR_PROMPT = new PromptTemplate({
  template: `You are a career coach helping a job seeker understand what success looks like in a role they are applying for.

Based on the job description below, generate a realistic OKR (Objectives and Key Results) plan for someone joining this position.
Cover 3 time horizons: First 30 days, First 90 days, First 6 months.
Also provide 3–5 interview preparation tips specific to this role's likely success metrics.

The language of your response must be: {language}

Job Description:
- Role: {role}
- Company: {company}
- Level: {level}
- Industry: {industry}
- Location: {location}
- Employment type: {employment_type}
- Responsibilities: {responsibilities}
- Required skills: {required_core_skills}
- Desirable skills: {desirable_skills}
- Tools & frameworks: {frameworks_tools}
- Domain keywords: {domain_keywords}

Return ONLY valid JSON in this exact shape:
{{
  "objectives": [
    {{
      "timeframe": "First 30 days",
      "objective": "...",
      "keyResults": ["...", "...", "..."]
    }},
    {{
      "timeframe": "First 90 days",
      "objective": "...",
      "keyResults": ["...", "...", "..."]
    }},
    {{
      "timeframe": "First 6 months",
      "objective": "...",
      "keyResults": ["...", "...", "..."]
    }}
  ],
  "interviewPrepTips": ["...", "...", "..."]
}}`,
  inputVariables: [
    'language', 'role', 'company', 'level', 'industry', 'location',
    'employment_type', 'responsibilities', 'required_core_skills',
    'desirable_skills', 'frameworks_tools', 'domain_keywords',
  ],
})

function fmt(arr: string[] | null | undefined): string {
  if (!arr?.length) return 'N/A'
  return arr.slice(0, 12).join(', ')
}

export async function generateOKR(
  jd: {
    role?: string | null
    company?: string | null
    level?: string | null
    industry?: string | null
    location?: string | null
    employment_type?: string | null
    responsibilities?: string[]
    required_core_skills?: string[]
    desirable_skills?: string[]
    frameworks_tools?: string[]
    domain_keywords?: string[]
  },
  language: 'en' | 'zh',
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4o-mini',
  reasoning = false,
): Promise<OKRContent> {
  const model = createLLM(provider, apiKey, modelId, reasoning)
  const prompt = await OKR_PROMPT.format({
    language: language === 'zh' ? 'Chinese (Simplified)' : 'English',
    role: jd.role ?? 'N/A',
    company: jd.company ?? 'N/A',
    level: jd.level ?? 'N/A',
    industry: jd.industry ?? 'N/A',
    location: jd.location ?? 'N/A',
    employment_type: jd.employment_type ?? 'N/A',
    responsibilities: fmt(jd.responsibilities),
    required_core_skills: fmt(jd.required_core_skills),
    desirable_skills: fmt(jd.desirable_skills),
    frameworks_tools: fmt(jd.frameworks_tools),
    domain_keywords: fmt(jd.domain_keywords),
  })

  const response = await model.invoke(prompt)
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return OKRSchema.parse(JSON.parse(jsonrepair(cleaned)))
}
