import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { createSession } from '@/app/lib/session'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getClientIp } from '@/app/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (!await checkRateLimit(ip, 'login')) {
      return Response.json(
        { error: 'Too many login attempts. Please try again in a minute.' },
        { status: 429 },
      )
    }

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

    if (!user.passwordHash) {
      return Response.json({ error: 'This account uses Google Sign-In. Please use "Continue with Google".' }, { status: 401 })
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
