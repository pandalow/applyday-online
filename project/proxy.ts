import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/app/lib/session'

const protectedRoutes = ['/app', '/admin', '/applications', '/market', '/workspace', '/profile', '/settings']
const authPages = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const session = await decrypt(request.cookies.get('session')?.value)

  if (protectedRoutes.some(r => path.startsWith(r)) && !session?.userId) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (path.startsWith('/admin') && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/app', request.nextUrl))
  }

  if (authPages.includes(path) && session?.userId) {
    return NextResponse.redirect(new URL('/app', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
