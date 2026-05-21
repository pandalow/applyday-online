import { PromptTemplate } from '@langchain/core/prompts'
import { createLLM } from '@/app/lib/ai/llm'
import type { AIProvider } from '@/app/lib/aiConfig'

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English', zh: 'Chinese (中文)', english: 'English', chinese: 'Chinese (中文)',
}

const INSIGHTS_PROMPT = new PromptTemplate({
  template: `You are a professional job market insights analyst.
Analyze structured market data and optionally compare against a candidate resume.

## Input Data
### Market Data (JSON with the following possible keys)
- freq.*: frequency counts for role, level, location, programming_languages, frameworks_tools, cloud_platforms, databases, employment_type, remote_work, benefits
- skill_demand_pct: each skill with count and pct (% of jobs requiring it)
- req_vs_desirable: skills with requiredPct and desirablePct side-by-side
- salary_insights: overall/byRole/byLevel salary stats (avg, median, min, max) + hasSalaryPct
- experience_profile: years-experience distribution buckets + avgMin/avgMax
- pos.responsibilities: POS-tagged word frequencies from job responsibilities
- tfidf.skills: differentiating skills per role by TF-IDF score
- graph.skills: PMI co-occurrence edges between skills
- swiss_knife: per-JD overload index (ODI) — high ODI = unrealistic role

{data}

### Candidate Resume (may be empty)
{resume_text}

## Analysis Tasks
0. **Executive Summary** — 3-4 sentences on key market trends and (if resume given) candidate alignment.
1. **Market Demand** — Top skills by demand %, split required vs desirable. What is truly non-negotiable?
2. **Salary & Experience Landscape** — Key salary ranges by level/role, typical experience requirements. Flag if salary data is scarce.
3. **Differentiating Skills** — TF-IDF standout skills per role. What separates candidates?
4. **Skill Synergies** — Strongest skill combinations from co-occurrence data.
5. **Job Quality Check** — Swiss-knife jobs (ODI > 1), remote/on-site balance, employment type split.
6. **Candidate Gap Analysis** (only if resume provided) — Map resume skills against req_vs_desirable and skill_demand_pct. Name specific missing high-demand skills.
7. **Action Plan** — Exactly 3 concrete, actionable tasks for the next 4–6 weeks.

## Output Requirements
- Respond in Markdown (no code block wrapper)
- Use ## headings for each section
- Be specific with numbers and percentages from the data
- Respond exclusively in {language}`,
  inputVariables: ['data', 'resume_text', 'language'],
})

export async function generateInsights(
  data: object,
  resumeText: string | undefined,
  language: string = 'en',
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4o-mini',
  reasoning = false,
): Promise<string> {
  const normalizedLanguage = LANGUAGE_MAP[language.toLowerCase()] ?? 'English'
  const model = createLLM(provider, apiKey, modelId, reasoning)
  const prompt = await INSIGHTS_PROMPT.format({
    data: JSON.stringify(data, null, 2),
    resume_text: resumeText ?? '',
    language: normalizedLanguage,
  })

  const response = await model.invoke(prompt)
  let content = typeof response.content === 'string' ? response.content : String(response.content)

  if (content.startsWith('```markdown\n') && content.endsWith('\n```')) {
    content = content.slice(12, -4)
  } else if (content.startsWith('```\n') && content.endsWith('\n```')) {
    content = content.slice(4, -4)
  }
  return content.trim()
}
