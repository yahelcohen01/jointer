import Link from "next/link";
import { useTranslations } from "next-intl";

export function MarketingHero() {
  const t = useTranslations("Marketing.hero");

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-24 flex flex-col items-center text-center gap-6">
      <h1 className="text-5xl font-bold font-display">{t("title")}</h1>
      <p className="text-xl text-muted-foreground max-w-md">{t("tagline")}</p>
      <Link
        href="/login"
        className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
      >
        {t("cta")}
      </Link>
    </main>
  );
}
