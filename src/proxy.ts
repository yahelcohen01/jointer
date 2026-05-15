import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

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

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (!isAppHost(host)) {
    // Phase 3 stub: custom-domain lookup goes here
    // (find profiles.custom_domain = host, rewrite to /[username]).
    return new NextResponse("Not found", { status: 404 });
  }

  // Forward the pathname as a request header so server components
  // (root layout, next-intl request config) can read it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return await updateSession(request, requestHeaders);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
