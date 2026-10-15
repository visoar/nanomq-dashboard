import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("writes a real HOCON file and restores its original content", async ({
  page,
}) => {
  const path = process.env.TEST_BROKER_CONFIG_PATH || "deploy/nanomq.test.conf";
  const original = await readFile(path, "utf8");
  const content = `${original}\n# dashboard-e2e-write-verification\n`;
  await login(page);
  await page.goto("/configuration/file");
  try {
    await page.getByLabel("完整 HOCON 配置").fill(content);
    await page.getByRole("button", { name: "审阅并写入" }).click();
    await page.getByRole("button", { name: "覆盖配置文件" }).click();
    await expect(
      page.getByText("配置文件已写入。可返回 Broker 配置页面执行重启。", {
        exact: true,
      }),
    ).toBeVisible();
    expect(await readFile(path, "utf8")).toContain(
      "# dashboard-e2e-write-verification",
    );
  } finally {
    const response = await page.request.post("/api/nanomq/config_update", {
      headers: { Origin: "http://127.0.0.1:3101" },
      data: { configuration: original },
    });
    expect(response.ok()).toBe(true);
  }
});
