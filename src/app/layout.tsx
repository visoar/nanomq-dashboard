import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/language-switch";
import { DashboardProvider } from "@/context/dashboard";
import { LanguageProvider } from "@/context/language";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "NanoMQ Dashboard", template: "%s · NanoMQ" },
  description: "NanoMQ HTTP API v4 operations console",
};
export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get("accept-language") ?? "",
  );
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <LanguageProvider initialLocale={locale}>
          <SkipLink />
          <DashboardProvider>{children}</DashboardProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
