import { expect, test } from "@playwright/test";
import { connectAsync } from "mqtt";
import { login, mqttURL } from "./helpers";

const origin = "http://127.0.0.1:3101";
test("publishes a batch and reports each actual broker result", async ({
  page,
}) => {
  const client = await connectAsync(mqttURL, {
    clientId: "dashboard-test-batch",
    reconnectPeriod: 0,
  });
  await client.subscribeAsync("dashboard-batch/#");
  const received: string[] = [];
  client.on("message", (_topic, payload) => received.push(payload.toString()));
  try {
    await login(page);
    await page.goto("/publish/batch");
    await page.getByLabel("消息数组（最多 100 条）").fill(
      JSON.stringify([
        {
          topic: "dashboard-batch/1",
          payload: "batch-one",
          qos: 0,
          retain: false,
        },
        {
          topic: "dashboard-batch/2",
          payload: "batch-two",
          qos: 1,
          retain: false,
        },
      ]),
    );
    await page.getByRole("button", { name: "审阅并发布" }).click();
    await page.getByRole("button", { name: "确认发布" }).click();
    await expect(page.getByText("Broker 已接受", { exact: true })).toHaveCount(
      2,
    );
    await expect.poll(() => received).toContain("batch-one");
    await expect.poll(() => received).toContain("batch-two");
  } finally {
    await client.endAsync();
  }
});
test("creates, edits, disables, enables and deletes a real republish rule", async ({
  page,
}) => {
  await login(page);
  const existing = await (await page.request.get("/api/nanomq/rules")).json();
  for (const rule of existing.data)
    if (rule.rawsql.includes("dashboard-rule/e2e/"))
      await page.request.delete(`/api/nanomq/rules/rule:${rule.id}`, {
        headers: { Origin: origin },
      });
  await page.goto("/rules");
  await page.getByRole("button", { name: "创建规则", exact: true }).click();
  const source = "dashboard-rule/e2e/source";
  const destination = "dashboard-rule/e2e/destination";
  const config = await (
    await page.request.get("/api/nanomq/configuration/basic")
  ).json();
  const server = String(config.data.basic.url)
    .replace("nmq-tcp://", "mqtt-tcp://")
    .replace("://0.0.0.0:", "://127.0.0.1:");
  await page
    .getByLabel("SQL", { exact: true })
    .fill(`SELECT * FROM "${source}"`);
  await page.getByLabel("动作参数（JSON）").fill(
    JSON.stringify({
      topic: destination,
      address: server,
      proto_ver: 4,
      keepalive: 60,
      clientid: "dashboard-test-rule-e2e",
    }),
  );
  await page.getByRole("button", { name: "审阅变更" }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  const row = page.locator("tbody tr").filter({ hasText: source });
  await expect(row).toHaveCount(1);
  const id = (await row.locator("td").first().innerText()).trim();
  try {
    await row.getByRole("button", { name: /编辑规则/ }).click();
    await page
      .getByLabel("SQL", { exact: true })
      .fill(`SELECT * FROM "${source}-edited"`);
    await page.getByRole("button", { name: "审阅变更" }).click();
    await page.getByRole("button", { name: "确认", exact: true }).click();
    await expect(row).toContainText(`${source}-edited`);
    await row.getByRole("button", { name: /停用规则/ }).click();
    await page.getByRole("button", { name: "确认", exact: true }).click();
    await expect(row).toContainText("已停用");
    await row.getByRole("button", { name: /启用规则/ }).click();
    await page.getByRole("button", { name: "确认", exact: true }).click();
    await expect(row).toContainText("已启用");
    await row.getByRole("button", { name: /删除规则/ }).click();
    await page.getByRole("button", { name: "确认", exact: true }).click();
    await expect(row).toHaveCount(0);
  } finally {
    await page.request.delete(`/api/nanomq/rules/${id}`, {
      headers: { Origin: origin },
      timeout: 3000,
    });
  }
});
test("manages real bridge subscriptions and switches the bridge", async ({
  page,
}) => {
  await login(page);
  await page.goto("/bridges");
  const row = page.locator("tbody tr").filter({ hasText: "test-edge" });
  await expect(row).toHaveCount(1);
  await row
    .getByRole("button", { name: "管理桥接订阅 test-edge", exact: true })
    .click();
  await page
    .getByLabel("远端主题", { exact: true })
    .fill("dashboard-bridge/e2e-remote");
  await page
    .getByLabel("本地主题", { exact: true })
    .fill("dashboard-bridge/e2e-local");
  await page.getByRole("button", { name: "添加桥接订阅", exact: true }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await row
    .getByRole("button", { name: "管理桥接订阅 test-edge", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "dashboard-bridge/e2e-remote",
  );
  await page
    .getByRole("button", {
      name: "取消桥接订阅 dashboard-bridge/e2e-remote",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await row
    .getByRole("button", { name: "停用桥接 test-edge", exact: true })
    .click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(row).toContainText("已停用");
  await row
    .getByRole("button", { name: "启用桥接 test-edge", exact: true })
    .click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(row).toContainText("已启用");
});
test("forwards real bridge messages and opens configuration file editing", async ({
  page,
}) => {
  const client = await connectAsync(mqttURL, {
    clientId: "dashboard-test-bridge-receiver",
    reconnectPeriod: 0,
  });
  const received: string[] = [];
  await client.subscribeAsync("dashboard-bridge/destination");
  client.on("message", (_topic, payload) => received.push(payload.toString()));
  try {
    await expect
      .poll(
        async () => {
          await client.publishAsync(
            "dashboard-bridge/source",
            "bridge-forwarded",
            { qos: 1 },
          );
          return received;
        },
        { timeout: 10000 },
      )
      .toContain("bridge-forwarded");
  } finally {
    await client.endAsync();
  }
  await login(page);
  await page.goto("/bridges");
  await page
    .getByRole("link", { name: "编辑桥接配置 test-edge", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "替换配置文件" }),
  ).toBeVisible();
});
