import { createLLM } from './llm'
import type { AIProvider } from '@/app/lib/aiConfig'

const PROMPT = `You are a resume formatter. Convert the resume text below into clean, structured Markdown that is optimised for AI parsing (e.g., for job-match analysis).

Rules:
- Use ## for main sections (Contact, Work Authorization, Education, Skills, Experience, Projects, Certifications)
- Use ### for sub-sections if needed
- Format each role/education entry as: **Company/School** | Title | Location | Date Range
- Convert all bullet symbols (●, •, *, etc.) to "- "
- In the Skills section, keep the existing categories but format each as: **Category:** item1, item2, item3
- In Experience/Projects, keep all bullet points but ensure they start with "- "
- Remove decorative whitespace and duplicate blank lines
- Do NOT add, invent, or remove any information — only reformat what is there
- Do NOT wrap output in a code block

Resume text:
{resume_text}`

export async function formatResume(
  text: string,
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4.1-mini',
  reasoning = false,
): Promise<string> {
  const llm = createLLM(provider, apiKey, modelId, reasoning)
  const prompt = PROMPT.replace('{resume_text}', text.slice(0, 12000))
  const response = await llm.invoke(prompt)
  const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  return raw.trim()
}
