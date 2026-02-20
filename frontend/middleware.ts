import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to protect routes that require authentication
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/']

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))

  // Get the access token from cookies or localStorage (via request headers)
  const token = request.cookies.get('access_token')?.value

  // If it's a protected route and there's no token, redirect to login
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If it's a public auth route and user has a token, redirect to deals
  if ((pathname === '/auth/login' || pathname === '/auth/register') && token) {
    return NextResponse.redirect(new URL('/deals', request.url))
  }

  return NextResponse.next()
}

// Match all routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
