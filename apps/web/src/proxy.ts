import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route guard. `/app/*` requires a session cookie; everything else is public.
 * Auth itself lives in the API; this only keeps unauthenticated visitors out of the shell.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/app')) {
    const authed = req.cookies.get('haulage.session')?.value === '1';
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
