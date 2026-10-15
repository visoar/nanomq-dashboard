import { expect, type Page } from "@playwright/test";
import { connectAsync, type MqttClient } from "mqtt";
export const brokerURL =
  process.env.TEST_BROKER_URL || "http://127.0.0.1:18081";
export const mqttURL = process.env.TEST_MQTT_URL || "mqtt://127.0.0.1:18884";
export const username = process.env.TEST_BROKER_USERNAME || "admin";
export const password = process.env.TEST_BROKER_PASSWORD || "public";
export async function login(page: Page) {
  await page.goto("/signin");
  await page.getByLabel("Broker HTTP 地址").fill(brokerURL);
  await page.getByLabel("用户名", { exact: true }).fill(username);
  await page.getByLabel("密码", { exact: true }).fill(password);
  await page.getByRole("button", { name: "连接 Broker", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "运行总览", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Broker 已连接", { exact: true })).toBeVisible();
}
export async function seedDevices(): Promise<MqttClient[]> {
  const devices = [
    "edge-gateway-01",
    "factory-sensor-01",
    "factory-sensor-02",
    "production-line-01",
    "warehouse-gateway-01",
    "warehouse-sensor-01",
  ];
  const clients: MqttClient[] = [];
  try {
    for (const [index, id] of devices.entries()) {
      const client = await connectAsync(mqttURL, {
        clientId: `dashboard-test-${id}`,
        username: index < 4 ? "factory" : "warehouse",
        protocolVersion: index % 2 ? 5 : 4,
        reconnectPeriod: 0,
      });
      clients.push(client);
      await client.subscribeAsync(
        index < 4
          ? `factory/line-${index + 1}/telemetry`
          : `warehouse/zone-${index - 3}/#`,
        { qos: (index % 3) as 0 | 1 | 2 },
      );
    }
    return clients;
  } catch (error) {
    await Promise.all(clients.map((c) => c.endAsync(true)));
    throw error;
  }
}
