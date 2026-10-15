"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/context/language";
import { isLocale } from "@/lib/i18n";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="language-switch">
      <Languages size={16} aria-hidden="true" />
      <select
        aria-label={t("语言")}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
      >
        <option value="zh-CN" lang="zh-CN">
          中文
        </option>
        <option value="en" lang="en">
          English
        </option>
      </select>
    </label>
  );
}
export function SkipLink() {
  const { t } = useI18n();
  return (
    <a className="skip-link" href="#main">
      {t("跳至主要内容")}
    </a>
  );
}
