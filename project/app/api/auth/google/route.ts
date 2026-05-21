import { generateState, generateCodeVerifier } from 'arctic'
import { cookies } from 'next/headers'
import { googleOAuth } from '@/app/lib/googleOAuth'

export async function GET() {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  const url = googleOAuth.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email'])

  const cookieStore = await cookies()
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax' as const,
  }
  cookieStore.set('google_oauth_state', state, opts)
  cookieStore.set('google_code_verifier', codeVerifier, opts)

  return Response.redirect(url.toString())
}
