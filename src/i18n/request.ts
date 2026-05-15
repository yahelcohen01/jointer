import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async () => {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const segment = pathname.split("/")[1] ?? "";
  const locale = hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
