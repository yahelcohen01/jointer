import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

export default async function RootMarketingPage() {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = saved && isLocale(saved) ? saved : defaultLocale;
  redirect(`/${locale}`);
}
