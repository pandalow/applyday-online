import { type NextRequest } from 'next/server'
import { db } from '@/app/lib/drizzle'
import { users, passwordResetTokens } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { sendPasswordResetEmail } from '@/app/lib/email'
import { checkRateLimit, getClientIp } from '@/app/lib/rateLimit'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!await checkRateLimit(ip, 'forgot')) {
    // Return 200 even when rate-limited — don't reveal that an email was/wasn't sent
    return Response.json({ ok: true })
  }

  try {
    const { email } = await request.json() as { email?: string }
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) })

    // Always return success — never reveal whether an email exists
    if (!user) return Response.json({ ok: true })

    // Delete any existing tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt })
    await sendPasswordResetEmail(user.email, token)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return Response.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
