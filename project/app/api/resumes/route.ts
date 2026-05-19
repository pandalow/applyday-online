import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { resumeTexts } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { eq, desc } from 'drizzle-orm'
import pdfParse from 'pdf-parse'

export async function GET() {
  const session = await verifySession()

  const rows = await db
    .select()
    .from(resumeTexts)
    .where(eq(resumeTexts.userId, session.userId))
    .orderBy(desc(resumeTexts.uploadedAt))

  return Response.json(rows)
}

export async function POST(request: NextRequest) {
  const session = await verifySession()

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'A PDF file is required in the "file" field' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return Response.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await pdfParse(buffer)
    const extractedText = parsed.text?.trim() ?? ''

    const [created] = await db
      .insert(resumeTexts)
      .values({
        userId: session.userId,
        name: file.name,
        text: extractedText,
      })
      .returning()

    return Response.json(created, { status: 201 })
  } catch (err) {
    console.error('[POST /api/resumes]', err)
    return Response.json({ error: 'Failed to upload resume' }, { status: 500 })
  }
}
