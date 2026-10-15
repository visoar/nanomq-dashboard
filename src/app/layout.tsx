import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardProvider } from "@/context/dashboard";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "NanoMQ Dashboard", template: "%s · NanoMQ" },
  description: "NanoMQ HTTP API v4 operations console",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main">
          跳至主要内容
        </a>
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
