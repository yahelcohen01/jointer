import type { Metadata } from "next";
import { Assistant, Heebo, Rubik } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-theme="sunrise"
      className={`${heebo.variable} ${rubik.variable} ${assistant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
