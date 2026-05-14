import type { Metadata } from "next";
import { Assistant, Heebo, Rubik } from "next/font/google";
import { headers } from "next/headers";
import { defaultLocale, dirFor, isLocale, type Locale } from "@/lib/i18n";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-sans",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const rubik = Rubik({
  variable: "--font-display",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const assistant = Assistant({
  variable: "--font-alt",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jointer",
  description: "Link-in-bio for Israeli creators.",
};

function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : defaultLocale;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const locale = localeFromPathname(pathname);

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      data-theme="sunrise"
      className={`${heebo.variable} ${rubik.variable} ${assistant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
