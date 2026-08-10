import { jsonrepair } from 'jsonrepair'
import { createLLM } from './llm'
import type { AIProvider } from '@/app/lib/aiConfig'

const PROMPT = `Extract the company name and job title from the job description below.
Return ONLY valid JSON: {"company": "...", "jobTitle": "..."}
Use an empty string for company if it is not mentioned.

JD:
{jd_text}`

export async function extractJobMeta(
  jdText: string,
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4o-mini',
  reasoning = false,
): Promise<{ company: string; jobTitle: string }> {
  const llm = createLLM(provider, apiKey, modelId, reasoning)
  const prompt = PROMPT.replace('{jd_text}', jdText.slice(0, 6000))
  const response = await llm.invoke(prompt)
  const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(jsonrepair(cleaned))
  return {
    company: String(parsed.company ?? ''),
    jobTitle: String(parsed.jobTitle ?? ''),
  }
}
