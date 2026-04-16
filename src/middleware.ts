import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Dev fallback: if env vars are missing, skip Supabase auth and allow request to proceed
    if (!supabaseUrl || !supabaseAnonKey) {
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Don't redirect for auth routes - just let them process cookies and continue
    if (request.nextUrl.pathname.startsWith("/auth")) {
        return response;
    }

    // If user is signed in and trying to access the landing page, redirect to dashboard
    if (user && request.nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user is NOT signed in and trying to access dashboard, redirect to landing page
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - privacy (public policy page)
         * 
         * NOTE: /auth routes ARE included so cookies (PKCE verifier) are handled properly
         */
        "/((?!_next/static|_next/image|favicon.ico|privacy).*)",
    ],
};
