import { deleteSession } from '@/app/lib/session'

export async function POST() {
  await deleteSession()
  return new Response(null, { status: 200 })
}
