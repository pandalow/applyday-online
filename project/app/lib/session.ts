import 'server-only'
import { SignJWT, jwtVerify, importSPKI, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'

export type SessionPayload = {
  userId: string
  role: 'admin' | 'user'
  username: string
} & JWTPayload

const secretKey = process.env.SESSION_SECRET
if (!secretKey) throw new Error('SESSION_SECRET environment variable is not set')
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, role: 'admin' | 'user', username: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, username })
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function updateSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)
  if (!session || !payload) return null

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// RSA verification: verify a signature against a public key and challenge
export async function verifyRSASignature(
  publicKeyPem: string,
  challenge: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    const publicKey = await importSPKI(publicKeyPem, 'RS256')
    const signatureBuffer = Buffer.from(signatureBase64, 'base64')
    const dataBuffer = new TextEncoder().encode(challenge)

    const isValid = await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      publicKey as CryptoKey,
      signatureBuffer,
      dataBuffer
    )
    return isValid
  } catch {
    return false
  }
}
