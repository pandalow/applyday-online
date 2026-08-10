import { getSessionOptional } from '@/app/lib/dal'

export async function GET() {
  const session = await getSessionOptional()
  return Response.json({ isAuth: !!session?.userId })
}
