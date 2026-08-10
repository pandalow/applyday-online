import { type NextRequest } from 'next/server'
import { extractJobMeta } from '@/app/lib/ai/extractJobMeta'
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

  const body = await request.json() as { jdText?: string }
  if (!body.jdText) return Response.json({ error: 'jdText required' }, { status: 400 })

  try {
    const meta = await extractJobMeta(body.jdText, apiKey, provider, modelId, reasoning)
    return Response.json(meta)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
