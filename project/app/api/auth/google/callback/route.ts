import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { googleOAuth } from '@/app/lib/googleOAuth'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { createSession } from '@/app/lib/session'
import { eq, or } from 'drizzle-orm'

interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture: string
  email_verified: boolean
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('google_oauth_state')?.value
  const codeVerifier = cookieStore.get('google_code_verifier')?.value

  // Clear OAuth cookies
  cookieStore.delete('google_oauth_state')
  cookieStore.delete('google_code_verifier')

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return Response.redirect(new URL('/login?error=oauth_invalid', request.url))
  }

  try {
    const tokens = await googleOAuth.validateAuthorizationCode(code, codeVerifier)
    const accessToken = tokens.accessToken()

    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userInfoRes.ok) throw new Error('Failed to fetch Google user info')
    const googleUser = await userInfoRes.json() as GoogleUserInfo

    if (!googleUser.email_verified) {
      return Response.redirect(new URL('/login?error=email_not_verified', request.url))
    }

    // Find existing user by googleId or email
    let user = await db.query.users.findFirst({
      where: or(
        eq(users.googleId, googleUser.sub),
        eq(users.email, googleUser.email),
      ),
    })

    if (user) {
      // Link Google ID and update avatar if not already set
      if (!user.googleId || !user.avatarUrl) {
        await db.update(users)
          .set({
            googleId: user.googleId ?? googleUser.sub,
            avatarUrl: user.avatarUrl ?? googleUser.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
      }
    } else {
      // New user — derive a unique username from their name/email
      const base = googleUser.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 20) || 'user'

      let username = base
      let suffix = 1
      while (await db.query.users.findFirst({ where: eq(users.username, username) })) {
        username = `${base}${suffix++}`
      }

      const [created] = await db.insert(users).values({
        username,
        email: googleUser.email,
        passwordHash: null,
        googleId: googleUser.sub,
        avatarUrl: googleUser.picture,
        role: 'user',
      }).returning()
      user = created
    }

    await createSession(user.id, user.role, user.username)
    return Response.redirect(new URL('/app', request.url))
  } catch (err) {
    console.error('[Google OAuth callback]', err)
    return Response.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}
