import { type NextRequest } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/drizzle'
import { userProfiles, users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, username: true, email: true, avatarUrl: true },
  })

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.userId),
  })

  return Response.json({ user, profile: profile ?? null })
}

export async function PATCH(request: NextRequest) {
  const session = await verifySession()

  const body = await request.json() as {
    headline?: string
    bio?: string
    skills?: string
    location?: string
    phone?: string
    linkedinUrl?: string
  }

  const existing = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.userId),
  })

  const fields = {
    headline: body.headline ?? null,
    bio: body.bio ?? null,
    skills: body.skills ?? null,
    location: body.location ?? null,
    phone: body.phone ?? null,
    linkedinUrl: body.linkedinUrl ?? null,
    updatedAt: new Date(),
  }

  if (existing) {
    const [updated] = await db
      .update(userProfiles)
      .set(fields)
      .where(eq(userProfiles.userId, session.userId))
      .returning()
    return Response.json(updated)
  } else {
    const [created] = await db
      .insert(userProfiles)
      .values({ userId: session.userId, ...fields })
      .returning()
    return Response.json(created, { status: 201 })
  }
}
