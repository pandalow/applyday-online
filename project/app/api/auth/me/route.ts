import { verifySession } from '@/app/lib/dal'

export async function GET() {
  const session = await verifySession()

  return Response.json({
    id: session.userId,
    username: session.username,
    role: session.role,
  })
}
