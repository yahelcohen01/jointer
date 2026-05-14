import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <header className="w-full flex justify-end px-4 py-3">
        <LocaleSwitcher />
      </header>
      {children}
    </NextIntlClientProvider>
  );
}
