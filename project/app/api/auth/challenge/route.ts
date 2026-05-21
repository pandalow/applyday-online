import { SignJWT } from 'jose'

const rawSecret = process.env.SESSION_SECRET
if (!rawSecret) throw new Error('SESSION_SECRET environment variable is not set')
const secretKey = new TextEncoder().encode(rawSecret)

export async function GET() {
  const nonce = crypto.randomUUID()

  // Sign the nonce as a 5-minute challenge token
  const challengeToken = await new SignJWT({ nonce, type: 'rsa-challenge' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretKey)

  return Response.json({ challenge: challengeToken, nonce })
}
