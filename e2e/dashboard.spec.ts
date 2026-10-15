import { expect, test } from "@playwright/test";
import { connectAsync, type MqttClient } from "mqtt";
import {
  brokerURL,
  login,
  mqttURL,
  password,
  seedDevices,
  username,
} from "./helpers";

let devices: MqttClient[] = [];
test.beforeAll(async () => {
  devices = await seedDevices();
});
test.afterAll(async () => {
  await Promise.all(devices.map((c) => c.endAsync()));
});
test("protects the proxy, checks origin and denies unconfigured targets", async ({
  request,
}) => {
  expect((await request.get("/api/nanomq/brokers")).status()).toBe(401);
  const input = { baseURL: brokerURL, authType: "basic", username, password };
  expect(
    (
      await request.post("/api/session", {
        data: input,
        headers: { Origin: "https://other.example" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/session", {
        data: { ...input, baseURL: "http://169.254.169.254" },
        headers: { Origin: "http://127.0.0.1:3101" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/session", {
        data: { ...input, password: "incorrect" },
        headers: { Origin: "http://127.0.0.1:3101" },
      })
    ).status(),
  ).toBe(401);
});
test("logs in, filters clients, opens details, exports and logs out", async ({
  page,
  context,
}) => {
  await login(page);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "nanomq-session")).toMatchObject({
    httpOnly: true,
    sameSite: "Strict",
  });
  expect(
    await page.evaluate(() => localStorage.getItem("nanomq-config")),
  ).toBeNull();
  await page.getByRole("link", { name: "客户端", exact: true }).click();
  await page
    .getByRole("textbox", { name: "搜索客户端", exact: true })
    .fill("factory-sensor-01");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "dashboard-test-factory-sensor-01",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "factory/line-2/telemetry",
  );
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出列表" }).click();
  expect((await download).suggestedFilename()).toBe("nanomq-clients.json");
  await page.reload();
  await expect(page.getByText("Broker 已连接", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "断开连接" }).click();
  await expect(page).toHaveURL(/\/signin$/);
  expect((await page.request.get("/api/nanomq/clients")).status()).toBe(401);
});
test("publishes HTTP messages to a real MQTT subscriber, including an empty payload", async ({
  page,
}) => {
  const client = await connectAsync(mqttURL, {
    clientId: "dashboard-test-publish",
    reconnectPeriod: 0,
  });
  const topic = "dashboard-test/http-publish";
  await client.subscribeAsync(topic, { qos: 1 });
  const received: string[] = [];
  client.on("message", (name, payload) => {
    if (name === topic) received.push(payload.toString());
  });
  try {
    await login(page);
    await page.getByRole("link", { name: "消息工作台", exact: true }).click();
    await page.getByLabel("主题", { exact: true }).fill(topic);
    await page.locator("#payload").fill('{"hello":"NanoMQ"}');
    await page.getByRole("button", { name: "发布消息", exact: true }).click();
    await expect(
      page.getByText("Broker 已接受发布请求", { exact: true }),
    ).toBeVisible();
    await expect.poll(() => received).toContain('{"hello":"NanoMQ"}');
    await page.locator("#payload").fill("");
    await page.getByRole("button", { name: "发布消息", exact: true }).click();
    await expect.poll(() => received).toContain("");
    await page.getByRole("checkbox", { name: /保留消息/ }).check();
    await page.getByRole("button", { name: "发布消息", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "清除保留消息" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "取消", exact: true }).click();
  } finally {
    await client.endAsync();
  }
});
test("reads live subscriptions and the topic tree", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "主题与订阅", exact: true }).click();
  await page
    .getByRole("textbox", { name: "搜索订阅" })
    .fill("factory/line-1/telemetry");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "主题层级", exact: true }).click();
  await expect(page.getByText("根主题", { exact: true })).toBeVisible();
});
test("persists hot configuration and verifies the broker readback", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Broker 配置", exact: true }).click();
  const field = page.getByLabel("重传队列长度", { exact: false });
  await expect(field).toHaveValue(/\d+/);
  const snapshot = await (await page.request.get("/api/nanomq/reload")).json();
  const original = await field.inputValue();
  const changed = String(Number(original) + 1);
  try {
    await field.fill(changed);
    await page.getByRole("button", { name: "审阅并保存" }).click();
    await page.getByRole("button", { name: "确认提交" }).click();
    await expect(
      page.getByText("配置已提交，并重新读取 Broker 当前值。", { exact: true }),
    ).toBeVisible();
    const readback = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/nanomq/reload") &&
        response.request().method() === "GET",
    );
    await page
      .getByRole("button", { name: "重新读取配置", exact: true })
      .click();
    await readback;
    await expect(field).toHaveValue(changed);
  } finally {
    const result = await page.request.post("/api/nanomq/reload", {
      headers: { Origin: "http://127.0.0.1:3101" },
      data: snapshot,
    });
    expect(result.ok()).toBe(true);
  }
});
test("supports mobile navigation without horizontal overflow", async ({
  page,
}) => {
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "打开导航" }).click();
  await page.getByRole("link", { name: "客户端", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "客户端", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("delivers binary Base64 payloads and MQTT 5 properties unchanged", async ({
  page,
}) => {
  const client = await connectAsync(mqttURL, {
    clientId: "dashboard-test-binary",
    protocolVersion: 5,
    reconnectPeriod: 0,
  });
  await client.subscribeAsync("dashboard-test/binary", { qos: 1 });
  const received: { hex: string; contentType?: string }[] = [];
  client.on("message", (_topic, payload, packet) =>
    received.push({
      hex: payload.toString("hex"),
      contentType: packet.properties?.contentType,
    }),
  );
  try {
    await login(page);
    await page.goto("/publish");
    await page
      .getByLabel("主题", { exact: true })
      .fill("dashboard-test/binary");
    await page
      .getByLabel("编码", { exact: true })
      .selectOption("decode-base64");
    await page.locator("#payload").fill("AP8BQmluYXJ5");
    await page.locator("summary").click();
    await page
      .getByLabel("MQTT 5 properties（JSON 对象）")
      .fill(
        '{"content_type":"application/octet-stream","user_properties":{"source":"real-e2e"}}',
      );
    await page.getByRole("button", { name: "发布消息", exact: true }).click();
    await expect
      .poll(() => received)
      .toContainEqual({
        hex: "00ff0142696e617279",
        contentType: "application/octet-stream",
      });
  } finally {
    await client.endAsync();
  }
});
