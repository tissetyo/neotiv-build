import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  // Skip auth for TV dashboard routes, API routes, login pages, static files, and root
  if (
    pathname.includes('/dashboard/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('/login') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // If Supabase not configured, allow all routes (dev mode)
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Admin routes — require superadmin
  if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (user.user_metadata?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return supabaseResponse;
  }

  // Hotel staff routes
  const slugMatch = pathname.match(/^\/([^/]+)\/(frontoffice|settings|analytics)/);
  if (slugMatch) {
    if (!user) {
      return NextResponse.redirect(new URL(`/${slugMatch[1]}/login`, request.url));
    }
    const role = user.user_metadata?.role;
    if (role !== 'frontoffice' && role !== 'manager' && role !== 'superadmin') {
      return NextResponse.redirect(new URL(`/${slugMatch[1]}/login`, request.url));
    }
    if ((slugMatch[2] === 'settings' || slugMatch[2] === 'analytics') && role === 'frontoffice') {
      return NextResponse.redirect(new URL(`/${slugMatch[1]}/frontoffice`, request.url));
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
