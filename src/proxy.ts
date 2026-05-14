import { type NextRequest, NextResponse } from "next/server";

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

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (isAppHost(host)) {
    // Forward the pathname as a header so server components (root layout,
    // next-intl request config) can read it without their own URL parsing.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Phase 3 stub: this is where custom-domain lookup will live
  // (find profiles.custom_domain = host, rewrite to /[username]).
  // For Phase 1, any unknown host 404s.
  return new NextResponse("Not found", { status: 404 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
