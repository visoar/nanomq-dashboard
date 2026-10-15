import en from "./en.json";

export type Locale = "zh-CN" | "en";
export type MessageValues = Record<string, string | number>;
export const LOCALE_COOKIE = "nanomq-language";
const english = en as Record<string, string>;

export function isLocale(value: unknown): value is Locale {
  return value === "zh-CN" || value === "en";
}
export function resolveLocale(saved?: string, acceptLanguage = ""): Locale {
  if (isLocale(saved)) return saved;
  const preferences = acceptLanguage.split(",").map((part, index) => {
    const [tag, ...parameters] = part.trim().split(";");
    const weight = parameters.find((p) => p.trim().startsWith("q="));
    const quality = weight ? Number(weight.trim().slice(2)) : 1;
    return { tag: tag.toLowerCase(), quality, index };
  });
  preferences.sort((a, b) => b.quality - a.quality || a.index - b.index);
  for (const { tag, quality } of preferences) {
    if (!Number.isFinite(quality) || quality <= 0 || quality > 1) continue;
    if (tag === "zh" || tag.startsWith("zh-")) return "zh-CN";
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }
  return "en";
}
export function translate(
  locale: Locale,
  key: string,
  values: MessageValues = {},
) {
  const text = locale === "en" ? (english[key] ?? key) : key;
  return text.replace(/\{(\w+)\}/g, (token, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : token,
  );
}
