import { type NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const APP_HOST_PATTERNS = [
  /^localhost(:\d+)?$/i,
  /^127\.0\.0\.1(:\d+)?$/,
  /\.vercel\.app$/i,
  /^jointer\.co$/i,
  /\.jointer\.co$/i,
];

function isAppHost(host: string): boolean {
  return APP_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

// Routes that require an authenticated session. Slice 3 = dashboard +
// onboarding. Future slices may add more.
const AUTH_REQUIRED_PREFIXES = ["/dashboard", "/onboarding"];

function isAuthRequired(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (!isAppHost(host)) {
    // Phase 3 stub: this is where custom-domain lookup will live
    // (find profiles.custom_domain = host, rewrite to /[username]).
    // For Phase 1, any unknown host 404s.
    return new NextResponse("Not found", { status: 404 });
  }

  // Forward the pathname as a request header so server components
  // (root layout, next-intl request config) can read it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  // Refresh the Supabase session (writes refreshed cookies onto response).
  const { response, user } = await updateSupabaseSession(request, requestHeaders);

  // Gate auth-required routes.
  if (!user && isAuthRequired(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
