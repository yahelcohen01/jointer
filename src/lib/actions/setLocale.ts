"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n";

const LOCALE_PREFIX_RE = /^\/(he|en)(?=\/|$)/;

export async function setLocaleAction(formData: FormData) {
  const locale = formData.get("locale");
  if (typeof locale !== "string" || !isLocale(locale)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const rawPathname = formData.get("pathname");
  const pathname =
    typeof rawPathname === "string" && rawPathname.startsWith("/") ? rawPathname : "/";
  const withoutLocale = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
  const target = withoutLocale === "/" ? `/${locale}` : `/${locale}${withoutLocale}`;

  redirect(target);
}
