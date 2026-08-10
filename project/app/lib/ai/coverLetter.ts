import { createLLM } from '@/app/lib/ai/llm'
import type { AIProvider } from '@/app/lib/aiConfig'
import type { CoverLetterTone } from '@/app/db/schema'

const TONE_INSTRUCTIONS: Record<CoverLetterTone, string> = {
  professional: 'Write in a formal, polished tone. Use precise language and maintain a business-appropriate style throughout.',
  conversational: 'Write in a warm, natural tone that still sounds professional. Avoid jargon. Make it feel like a genuine human voice.',
  enthusiastic: 'Write with energy and genuine excitement for the role. Show passion for the company mission and the specific opportunity.',
}

const PROMPT = `You are an expert career coach. Write a compelling cover letter for the candidate based on their resume and the job description.

LANGUAGE: Write the entire cover letter in {language}.

Tone instruction: {tone_instruction}

Guidelines:
- 3–4 paragraphs, max 350 words
- Opening: hook that shows you understand the company/role, not "I am applying for..."
- Body: connect 2–3 specific experiences/skills from the resume directly to JD requirements
- Closing: confident call to action, no "Thank you for your consideration" clichés
- Do NOT include date, address headers, or "Dear Hiring Manager" — output body paragraphs only
- Reference the company name and role title naturally in the text

Job Description:
Company: {company}
Role: {role}
Key requirements: {requirements}
Key responsibilities: {responsibilities}

Resume:
{resume_text}

Output the cover letter text only. No extra commentary.`

function fmt(arr: string[] | null | undefined, limit = 10): string {
  if (!arr?.length) return 'N/A'
  return arr.slice(0, limit).join(', ')
}

export async function generateCoverLetter(
  resume: { text: string },
  jd: {
    company?: string | null
    role?: string | null
    requiredCoreSkills?: string[] | null
    responsibilities?: string[] | null
    desirableSkills?: string[] | null
    frameworksTools?: string[] | null
  },
  tone: CoverLetterTone = 'professional',
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4o-mini',
  reasoning = false,
  language: 'en' | 'zh' = 'en',
): Promise<string> {
  const model = createLLM(provider, apiKey, modelId, reasoning)

  const requirements = [
    ...( jd.requiredCoreSkills ?? []),
    ...( jd.desirableSkills ?? []),
    ...( jd.frameworksTools ?? []),
  ]

  const langLabel = language === 'zh' ? 'Chinese (Simplified)' : 'English'

  const prompt = PROMPT
    .replace('{language}', langLabel)
    .replace('{tone_instruction}', TONE_INSTRUCTIONS[tone])
    .replace('{company}', jd.company ?? 'the company')
    .replace('{role}', jd.role ?? 'the role')
    .replace('{requirements}', fmt(requirements))
    .replace('{responsibilities}', fmt(jd.responsibilities))
    .replace('{resume_text}', resume.text.slice(0, 20000))

  const response = await model.invoke(prompt)
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  return content.trim()
}
