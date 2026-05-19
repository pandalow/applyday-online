import { SignJWT } from 'jose'

// Challenge tokens are short-lived signed JWTs — no server-side store needed.
// The client signs the nonce extracted from the JWT with their RSA private key.
const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET)

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
