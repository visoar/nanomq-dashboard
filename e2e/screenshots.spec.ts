import { mkdir } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import type { MqttClient } from "mqtt";
import { login, seedDevices } from "./helpers";

test.skip(!process.env.CAPTURE_SCREENSHOTS, "Explicit screenshot capture only");
let devices: MqttClient[] = [];
test.beforeAll(async () => {
  await mkdir("docs/screenshots", { recursive: true });
  devices = await seedDevices();
});
test.afterAll(async () => {
  await Promise.all(devices.map((c) => c.endAsync()));
});

async function captureLanguages(page: Page, name: string) {
  for (const locale of ["zh-CN", "en"] as const) {
    await page
      .getByRole("combobox", { name: /^(语言|Language)$/ })
      .selectOption(locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await page.screenshot({
      path: `docs/screenshots/${name}${locale === "en" ? "-en" : ""}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh-CN");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
}

test("capture matching Chinese and English screens for both READMEs", async ({
  page,
}) => {
  await page.goto("/signin");
  await expect(
    page.getByRole("button", { name: "连接 Broker", exact: true }),
  ).toBeEnabled();
  await captureLanguages(page, "signin");
  await login(page);
  await page.getByRole("button", { name: "立即刷新", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "立即刷新", exact: true }),
  ).toBeEnabled();
  await captureLanguages(page, "overview");
  await page.getByRole("link", { name: "客户端", exact: true }).click();
  await expect(page.locator("tbody tr")).not.toHaveCount(0);
  await captureLanguages(page, "clients");
  await page.getByRole("link", { name: "消息工作台", exact: true }).click();
  await page
    .getByLabel("主题", { exact: true })
    .fill("factory/line-01/telemetry");
  await page
    .locator("#payload")
    .fill(
      '{\n  "temperature": 24.5,\n  "humidity": 62,\n  "unit": "celsius"\n}',
    );
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  await page.getByRole("button", { name: "发布消息", exact: true }).click();
  await expect(
    page.getByText("Broker 已接受发布请求", { exact: true }),
  ).toBeVisible();
  await captureLanguages(page, "publish");
  await page.getByRole("link", { name: "Broker 配置", exact: true }).click();
  await expect(page.getByLabel("重传队列长度", { exact: false })).toHaveValue(
    /\d+/,
  );
  await captureLanguages(page, "configuration");
  await page.getByRole("button", { name: "切换主题" }).click();
  await page.getByRole("link", { name: "运行总览", exact: true }).click();
  await captureLanguages(page, "overview-dark");
  await page.getByRole("button", { name: "切换主题" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await captureLanguages(page, "mobile");
});
