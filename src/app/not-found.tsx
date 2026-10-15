"use client";
import Link from "next/link";
import { LanguageSwitch } from "@/components/language-switch";
import { useI18n } from "@/context/language";
export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="loading-screen" id="main">
      <LanguageSwitch />
      <h1>{t("404 · 页面不存在")}</h1>
      <Link className="button primary" href="/">
        {t("返回控制台")}
      </Link>
    </main>
  );
}
