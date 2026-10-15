import { expect, test } from "@playwright/test";
import { brokerURL, password, username } from "./helpers";

test.use({ locale: "en-US" });
async function connect(page: import("@playwright/test").Page) {
  await page.goto("/signin");
  await page.getByLabel("Broker HTTP URL").fill(brokerURL);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Connect broker", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Broker connected", { exact: true }),
  ).toBeVisible();
}

test("uses browser language on the server and saves explicit preference across pages and reloads", async ({
  page,
}) => {
  const response = await page.goto("/signin");
  expect(await response?.text()).toContain('lang="en"');
  await expect(
    page.getByRole("heading", { name: "Connect to NanoMQ", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Username", { exact: true }).fill("keep-this-value");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh-CN");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByLabel("用户名", { exact: true })).toHaveValue(
    "keep-this-value",
  );
  const reload = await page.reload();
  expect(await reload?.text()).toContain('lang="zh-CN"');
  await expect(
    page.getByRole("heading", { name: "连接 NanoMQ", exact: true }),
  ).toBeVisible();
  await page.goto("/missing-page");
  await expect(
    page.getByRole("heading", { name: "404 · 页面不存在" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "返回控制台" }).click();
  await expect(
    page.getByRole("heading", { name: "连接 NanoMQ", exact: true }),
  ).toBeVisible();
});

test("localizes real authentication failures without clearing the form", async ({
  page,
}) => {
  await page.goto("/signin");
  await page.getByLabel("Broker HTTP URL").fill(brokerURL);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page
    .getByRole("button", { name: "Connect broker", exact: true })
    .click();
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "NanoMQ authentication failed",
  );
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh-CN");
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "NanoMQ 认证失败",
  );
  await expect(page.getByLabel("密码", { exact: true })).toHaveValue(
    "wrong-password",
  );
});

test("renders every management page and dynamic confirmations in English, then switches without losing edits", async ({
  page,
}) => {
  await connect(page);
  const routes = [
    ["/clients", "Clients"],
    ["/subscriptions", "Topics & subscriptions"],
    ["/monitoring", "Monitoring"],
    ["/bridges", "MQTT bridges"],
    ["/rules", "Rule engine"],
    ["/configuration", "Broker configuration"],
    ["/configuration/file", "Replace configuration file"],
    ["/publish/batch", "Batch publish"],
    ["/publish", "Message workbench"],
  ];
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }).first(),
    ).toBeVisible();
    for (const section of [".sidebar", "main#main", ".breadcrumbs"]) {
      await expect(page.locator(section)).not.toContainText(/\p{Script=Han}/u);
    }
    const labels = await page
      .locator("[aria-label]")
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("aria-label")).join(" "),
      );
    expect(labels).not.toMatch(/\p{Script=Han}/u);
  }
  await page.getByLabel("Topic", { exact: true }).fill("language/retain-test");
  await page.getByLabel("Retain message", { exact: false }).check();
  await page
    .getByRole("button", { name: "Publish message", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "An empty payload with Retain clears the retained message on language/retain-test.",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.locator("#payload").fill("preserve my payload");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh-CN");
  await expect(
    page.getByRole("heading", { name: "消息工作台", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("主题", { exact: true })).toHaveValue(
    "language/retain-test",
  );
  await expect(page.locator("#payload")).toHaveValue("preserve my payload");
  await page
    .getByRole("combobox", { name: "语言", exact: true })
    .selectOption("en");
  await page.getByLabel("Topic", { exact: true }).fill("invalid/#");
  await page
    .getByRole("button", { name: "Publish message", exact: true })
    .click();
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "Invalid publish topic",
  );
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh-CN");
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "发布主题无效",
  );
});

test("keeps English navigation and controls usable on mobile", async ({
  page,
}) => {
  await connect(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Topics & subscriptions", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Topics & subscriptions", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("zh-CN");
  await expect(
    page.getByRole("heading", { name: "主题与订阅", exact: true }),
  ).toBeVisible();
});
