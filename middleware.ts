import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    // If the user is not signed in and the route is protected, redirect to sign-in
    const protectedRoutes = ['/dashboard', '/occurrences', '/investigations', '/actions', '/training', '/reports', '/communications', '/settings'];
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

    if (!session && isProtectedRoute) {
        const redirectUrl = new URL('/sign-in', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // If the user is signed in and trying to access sign-in, redirect to dashboard
    if (session && req.nextUrl.pathname === '/sign-in') {
        const redirectUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // If the user is signed in and accessing the root path, redirect to dashboard
    if (session && req.nextUrl.pathname === '/') {
        const redirectUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    return res;
}