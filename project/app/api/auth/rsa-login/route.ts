import { type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { createSession, verifyRSASignature } from '@/app/lib/session'
import { eq } from 'drizzle-orm'

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET)

async function verifyChallenge(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] })
    if (payload.type !== 'rsa-challenge' || typeof payload.nonce !== 'string') {
      return null
    }
    return payload.nonce
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, challenge, signature } = body

    if (!username || !challenge || !signature) {
      return Response.json(
        { error: 'username, challenge, and signature are required' },
        { status: 400 },
      )
    }

    // Verify the challenge JWT and extract the nonce
    const nonce = await verifyChallenge(challenge)
    if (!nonce) {
      return Response.json(
        { error: 'Invalid or expired challenge' },
        { status: 401 },
      )
    }

    // Fetch user and their RSA public key
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (!user || !user.rsaPublicKey) {
      return Response.json(
        { error: 'User not found or RSA login not configured' },
        { status: 401 },
      )
    }

    // Verify the RSA signature over the nonce
    const isValid = await verifyRSASignature(user.rsaPublicKey, nonce, signature)
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    await createSession(user.id, user.role, user.username)

    return Response.json({
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (err) {
    console.error('[POST /api/auth/rsa-login]', err)
    return Response.json({ error: 'RSA login failed' }, { status: 500 })
  }
}
