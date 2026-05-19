import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { createSession } from '@/app/lib/session'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return Response.json(
        { error: 'username and password are required' },
        { status: 400 },
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await createSession(user.id, user.role, user.username)

    return Response.json({
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return Response.json({ error: 'Login failed' }, { status: 500 })
  }
}
