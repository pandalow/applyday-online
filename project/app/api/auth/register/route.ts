import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { createSession } from '@/app/lib/session'
import { eq, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body

    if (!username || !email || !password) {
      return Response.json(
        { error: 'username, email, and password are required' },
        { status: 400 },
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      )
    }

    // Check for existing username or email
    const existing = await db.query.users.findFirst({
      where: or(eq(users.username, username), eq(users.email, email)),
    })

    if (existing) {
      const conflict = existing.username === username ? 'username' : 'email'
      return Response.json(
        { error: `That ${conflict} is already taken` },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const [user] = await db
      .insert(users)
      .values({ username, email, passwordHash, role: 'user' })
      .returning()

    await createSession(user.id, user.role, user.username)

    return Response.json(
      { user: { id: user.id, username: user.username, role: user.role } },
      { status: 201 },
    )
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
