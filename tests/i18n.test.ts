import { describe, expect, it } from "vitest";
import { ApiError, message } from "@/lib/api";
import { publishSchema, reloadSchema } from "@/lib/contracts";
import { resolveLocale, translate } from "@/lib/i18n";
import en from "@/lib/i18n/en.json";
import { errorMessage } from "@/lib/i18n/errors";

describe("locale preferences", () => {
  it("uses a valid saved choice before browser preferences", () => {
    expect(resolveLocale("zh-CN", "en-US,en;q=0.9")).toBe("zh-CN");
    expect(resolveLocale("en", "zh-CN")).toBe("en");
    expect(resolveLocale("invalid", "zh-TW,en;q=0.5")).toBe("zh-CN");
  });
  it("matches supported language families by quality and falls back to English", () => {
    expect(resolveLocale(undefined, "fr,en-GB;q=0.8,zh-CN;q=0.2")).toBe("en");
    expect(resolveLocale(undefined, "en;q=0.1,zh;q=0.9")).toBe("zh-CN");
    expect(resolveLocale(undefined, "zh;q=0,en-US;q=0.5")).toBe("en");
    expect(resolveLocale(undefined, "zh;q=invalid")).toBe("en");
    expect(resolveLocale(undefined, "de-DE")).toBe("en");
  });
});
describe("translations", () => {
  it("provides nonempty English copy and keeps interpolation names aligned", () => {
    const tokens = (text: string) =>
      [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), key).not.toBe("");
      expect(value, key).not.toMatch(/\p{Script=Han}/u);
      expect(tokens(value), key).toEqual(tokens(key));
    }
  });
  it("formats complete sentences in both languages and preserves protocol values", () => {
    expect(
      translate("en", "共 {count} 条 · 第 {page} / {pages} 页", {
        count: 23,
        page: 2,
        pages: 3,
      }),
    ).toBe("23 items · Page 2 of 3");
    expect(
      translate("zh-CN", "共 {count} 条 · 第 {page} / {pages} 页", {
        count: 23,
        page: 2,
        pages: 3,
      }),
    ).toBe("共 23 条 · 第 2 / 3 页");
    expect(
      translate("en", "管理桥接订阅 {name}", { name: "edge-{name}" }),
    ).toBe("Manage bridge subscriptions edge-{name}");
    expect(translate("en", "MQTT 5.0")).toBe("MQTT 5.0");
  });
});
describe("localized diagnostics", () => {
  it("translates known failures and preserves unknown broker details", () => {
    expect(errorMessage("zh-CN", "NanoMQ authentication failed")).toContain(
      "认证失败",
    );
    expect(errorMessage("en", "NanoMQ authentication failed")).toBe(
      "NanoMQ authentication failed",
    );
    expect(
      errorMessage("zh-CN", "NanoMQ rejected the request (code 111)"),
    ).toContain("111");
    expect(errorMessage("zh-CN", "Upstream-specific diagnostic 0x42")).toBe(
      "Upstream-specific diagnostic 0x42",
    );
    expect(errorMessage("en", "消息内容不是有效的 JSON。")).toBe(
      "The payload is not valid JSON.",
    );
  });
  it("localizes schema issues on the client and from the proxy, including custom rules", () => {
    const invalid = publishSchema.safeParse({
      topic: "invalid/#",
      payload: "x",
      qos: 0,
    });
    if (invalid.success) throw new Error("Expected an invalid topic");
    const serialized = message(invalid.error);
    expect(errorMessage("zh-CN", serialized)).toContain("发布主题无效");
    expect(errorMessage("en", serialized)).toContain("Invalid publish topic");
    const remote = message(
      new ApiError("Validation failed", 400, invalid.error.issues),
    );
    expect(errorMessage("zh-CN", remote)).toBe(
      errorMessage("zh-CN", serialized),
    );
    const range = reloadSchema.safeParse({ property_size: 0 });
    if (range.success) throw new Error("Expected invalid settings");
    expect(errorMessage("zh-CN", message(range.error))).toContain("数值过小");
    expect(errorMessage("en", message(range.error))).toContain("Too small");
    expect(errorMessage("zh-CN", message(new SyntaxError("bad JSON")))).toBe(
      "输入的 JSON 无效。",
    );
  });
});
