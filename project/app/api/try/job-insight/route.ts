import { type NextRequest } from 'next/server'
import { generateJobInsight } from '@/app/lib/ai/jobInsight'
import { checkRateLimit, getClientIp } from '@/app/lib/rateLimit'
import type { AIProvider } from '@/app/lib/aiConfig'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!await checkRateLimit(ip, 'try')) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const apiKey = request.headers.get('X-AI-Key')
  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as AIProvider
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4o-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  if (!apiKey) return Response.json({ error: 'AI API key required' }, { status: 400 })

  const body = await request.json() as {
    jdText?: string
    resumeText?: string
    language?: 'en' | 'zh'
  }
  if (!body.jdText) return Response.json({ error: 'jdText required' }, { status: 400 })

  const language = body.language === 'zh' ? 'zh' : 'en'
  const resume = body.resumeText ? { text: body.resumeText } : null

  try {
    const content = await generateJobInsight(
      body.jdText,
      resume,
      apiKey,
      provider,
      modelId,
      reasoning,
      language,
    )
    return Response.json({ content })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate insight'
    return Response.json({ error: msg }, { status: 500 })
  }
}
