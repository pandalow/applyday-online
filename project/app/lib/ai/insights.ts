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
### Market Data
{data}

### Candidate Resume (may be empty)
{resume_text}

## Analysis Tasks
0. **Executive Summary** - 3-4 sentences on key trends and candidate alignment.
1. **Must-Have Skills** - Top recurring skills from frequency results.
2. **Differentiating Skills** - Top TF-IDF skills per role and why they matter.
3. **Skill Synergies** - Strongest skill pairs/clusters from co-occurrence graph.
4. **Swiss-Knife JD Check** - Identify overloaded JDs (high ODI) and advice.
5. **Candidate Fit Analysis** (only if resume provided) - Compare candidate skills, highlight strengths and gaps.
6. **Action Plan** - Exactly 3 realistic, actionable tasks for next 1-2 months.

## Output Requirements
- Respond in Markdown (no code blocks wrapper)
- Use ## headings for each section
- Be concise, insightful, and practical
- Respond exclusively in {language}
- Do NOT wrap in markdown code blocks`,
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
