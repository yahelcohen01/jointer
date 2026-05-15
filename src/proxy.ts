import { type NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, negotiateLocale } from "@/lib/i18n";
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

// Routes that should always live under a locale prefix. Anything not in this
// set (notably bare `/[username]` profile URLs and `/auth/*` callbacks) passes
// through untouched.
const LOCALIZED_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/set-password",
  "/dashboard",
  "/onboarding",
];

const LOCALE_PREFIX_RE = /^\/(he|en)(?=\/|$)/;

// Reserved root paths that are neither localized routes nor profile usernames.
const ROOT_RESERVED_PREFIXES = ["/auth", "/api", "/u"];

function hasLocalePrefix(pathname: string): boolean {
  return LOCALE_PREFIX_RE.test(pathname);
}

function shouldLocalize(pathname: string): boolean {
  if (pathname === "/") return true;
  return LOCALIZED_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isReservedRoot(pathname: string): boolean {
  return ROOT_RESERVED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Public profile pages live at the bare root: `/joe`. Internally the route
// file is `app/u/[username]/page.tsx` (the `[username]` segment can't coexist
// with `[locale]` at root, so we rewrite). Only triggered for single-segment
// paths that aren't a locale, a localized app route, or a reserved root.
function isBareUsernamePath(pathname: string): boolean {
  if (pathname === "/" || pathname.length < 2) return false;
  if (pathname.indexOf("/", 1) !== -1) return false; // multi-segment
  return true;
}

const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (!isAppHost(host)) {
    // Phase 3 stub: custom-domain lookup goes here
    // (find profiles.custom_domain = host, rewrite to /[username]).
    return new NextResponse("Not found", { status: 404 });
  }

  const { pathname } = request.nextUrl;

  // Bare unprefixed app route → negotiate and redirect to /{locale}<path>.
  // 307 (not 308) because the choice depends on cookie/header and may change.
  if (!hasLocalePrefix(pathname) && shouldLocalize(pathname)) {
    const locale = negotiateLocale(
      request.headers.get("accept-language"),
      request.cookies.get(LOCALE_COOKIE)?.value,
    );
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    const response = NextResponse.redirect(url, 307);
    response.cookies.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
    return response;
  }

  // Forward the pathname as a request header so server components
  // (root layout, next-intl request config) can read it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Bare-username rewrite: `/joe` (single segment, not a locale, not reserved)
  // is served by app/u/[username]/page.tsx. Internal rewrite preserves the
  // short URL in the address bar.
  if (
    !hasLocalePrefix(pathname) &&
    !isReservedRoot(pathname) &&
    isBareUsernamePath(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/u${pathname}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  const response = await updateSession(request, requestHeaders);

  // Keep NEXT_LOCALE cookie in sync with the URL prefix. If the user navigates
  // to /en via a shared link, the cookie should follow so future bare URLs
  // negotiate to the same locale.
  const localeMatch = pathname.match(LOCALE_PREFIX_RE);
  if (localeMatch && response instanceof NextResponse) {
    const currentLocale = localeMatch[1];
    const existing = request.cookies.get(LOCALE_COOKIE)?.value;
    if (existing !== currentLocale) {
      response.cookies.set(LOCALE_COOKIE, currentLocale, LOCALE_COOKIE_OPTIONS);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
