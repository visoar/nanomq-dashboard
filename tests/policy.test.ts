import { describe, expect, it } from "vitest";
import { brokerRequest } from "@/lib/server/broker";
import { permitted, validateBody } from "@/lib/server/policy";

describe("API policy", () => {
  it("limits proxy operations to implemented v4 endpoints", () => {
    for (const [method, path] of [
      ["POST", "/reload"],
      ["PUT", "/rules/rule:1"],

      ["POST", "/mqtt/publish_batch"],
    ])
      expect(permitted(method, path)).toBe(true);
    for (const [method, path] of [
      ["GET", "/file"],
      ["DELETE", "/clients/a"],
      ["POST", "/mqtt/subscribe_batch"],
      ["GET", "//evil.example"],
      ["POST", "/configuration/bridge"],
      ["PUT", "/bridges/edge"],
      ["DELETE", "/bridges/edge"],
    ])
      expect(permitted(method, path)).toBe(false);
  });
  it("validates configuration section envelopes", () => {
    expect(() => validateBody("/configuration/basic", {})).toThrow();
    expect(() =>
      validateBody("/configuration/basic", { data: { tls: {} } }),
    ).toThrow();
    expect(() =>
      validateBody("/configuration/basic", { data: { basic: "invalid" } }),
    ).toThrow();
    expect(
      validateBody("/configuration/basic", {
        data: { basic: { msq_len: 1024 } },
      }),
    ).toEqual({ data: { basic: { msq_len: 1024 } } });
  });
  it("rejects invalid publication and rule payloads before reaching NanoMQ", () => {
    expect(() =>
      validateBody("/mqtt/publish", { topic: "a/#", payload: "" }),
    ).toThrow();
    expect(() =>
      validateBody("/rules", { rawsql: "SELECT * FROM a", actions: [] }),
    ).toThrow();
    expect(() =>
      validateBody("/rules", {
        rawsql: "SELECT * FROM a",
        actions: [{ name: "repub", params: { address: 2, topic: "out" } }],
      }),
    ).toThrow();
  });
  it("returns an actual connection failure instead of synthetic metrics", async () => {
    await expect(
      brokerRequest(
        {
          baseURL: "http://127.0.0.1:1",
          authType: "basic",
          username: "test",
          password: "test",
        },
        "/metrics",
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
});
it("preserves exact HOCON file contents", () => {
  const configuration = '\nlisteners.tcp.bind = "0.0.0.0:1883"\n';
  expect(validateBody("/config_update", { configuration })).toBe(configuration);
  expect(() =>
    validateBody("/config_update", { configuration: "  \n" }),
  ).toThrow();
});
