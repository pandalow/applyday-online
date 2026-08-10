import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { resumeTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, and } from 'drizzle-orm'
import { formatResume } from '@/app/lib/ai/formatResume'
import type { AIProvider } from '@/app/lib/aiConfig'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession()
  const { id } = await params

  const row = await db.query.resumeTexts.findFirst({
    where: and(eq(resumeTexts.id, id), eq(resumeTexts.userId, session.userId)),
  })
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })

  const apiKey = request.headers.get('X-AI-Key')
  const provider = (request.headers.get('X-AI-Provider') ?? 'openai') as AIProvider
  const modelId = request.headers.get('X-AI-Model') ?? 'gpt-4.1-mini'
  const reasoning = request.headers.get('X-AI-Reasoning') === 'true'

  if (!apiKey) return Response.json({ error: 'AI API key required' }, { status: 400 })

  try {
    const formatted = await formatResume(row.text, apiKey, provider, modelId, reasoning)
    return Response.json({ text: formatted })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Formatting failed'
    console.error('[resume format]', err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
