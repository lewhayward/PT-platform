import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/trainer", "/client"];
const AUTH_ROUTES = ["/", "/login", "/signup"];

// Called from src/proxy.ts on every request. Refreshes the Supabase auth
// cookie (so sessions don't silently expire) and does a fast "optimistic"
// redirect - signed-out users get bounced from protected pages, signed-in
// users get bounced away from the login/sign-up forms. This is only a
// smooth-experience layer; the real security check happens server-side in
// requireProfile() (src/lib/supabase/dal.ts), since Proxy shouldn't be the
// only line of defence.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Cookies must be written to both the outgoing request (so this
          // same pass sees the refreshed session) and the response (so the
          // browser stores it).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const path = request.nextUrl.pathname;

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    path.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.includes(path);

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const destination = profile?.role === "trainer" ? "/trainer" : "/client";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}
