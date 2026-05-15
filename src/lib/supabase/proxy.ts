import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

const AUTH_REQUIRED_PREFIXES = ["/dashboard", "/onboarding"];
const PUBLIC_AUTH_ROUTES = ["/login", "/signup"];
const LOCALE_PREFIX_RE = /^\/(he|en)(?=\/|$)/;
const DEFAULT_LOCALE_FOR_REDIRECT = "en";

function pathStartsWithAny(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function splitLocale(pathname: string): { locale: string; rest: string } {
  const match = pathname.match(LOCALE_PREFIX_RE);
  if (!match) return { locale: DEFAULT_LOCALE_FOR_REDIRECT, rest: pathname };
  const rest = pathname.slice(match[0].length) || "/";
  return { locale: match[1], rest };
}

/**
 * Refreshes the Supabase session and applies route gating.
 *
 * Mirrors the pattern used elsewhere — getUser() validates the JWT (don't
 * substitute getSession(); that one trusts the cookie alone). The double
 * cookie write (request + response) is intentional: request.cookies makes
 * the refreshed token visible to the rest of this request; response.cookies
 * persists it back to the browser.
 */
export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const { locale, rest } = splitLocale(pathname);
  const needsAuth = pathStartsWithAny(rest, AUTH_REQUIRED_PREFIXES);
  const isAuthPage = pathStartsWithAny(rest, PUBLIC_AUTH_ROUTES);

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
