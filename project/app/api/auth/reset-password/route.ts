import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { users, passwordResetTokens } from '@/app/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getClientIp } from '@/app/lib/rateLimit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!await checkRateLimit(ip, 'reset')) {
    return Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const { token, password } = await request.json() as { token?: string; password?: string }

    if (!token || !password) {
      return Response.json({ error: 'Token and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const row = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    })

    if (!row) {
      return Response.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await Promise.all([
      db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, row.userId)),
      db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId)),
    ])

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return Response.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
