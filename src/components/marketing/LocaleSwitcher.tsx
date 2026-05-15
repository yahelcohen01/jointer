"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { setLocaleAction } from "@/lib/actions/setLocale";
import { locales } from "@/lib/i18n";

export function LocaleSwitcher() {
  const t = useTranslations("Marketing.localeSwitcher");
  const pathname = usePathname();

  return (
    <form
      action={setLocaleAction}
      className="flex items-center gap-1 text-sm"
      aria-label={t("label")}
    >
      <input type="hidden" name="pathname" value={pathname} />
      {locales.map((loc) => (
        <button
          key={loc}
          type="submit"
          name="locale"
          value={loc}
          className="px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {t(loc)}
        </button>
      ))}
    </form>
  );
}
