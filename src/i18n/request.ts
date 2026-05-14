import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : defaultLocale;
}

export default getRequestConfig(async () => {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const locale = localeFromPathname(pathname);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
