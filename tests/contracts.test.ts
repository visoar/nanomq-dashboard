import { describe, expect, it } from "vitest";
import {
  clientSchema,
  parseMetrics,
  parsePrometheus,
  publishSchema,
  rate,
  reloadSchema,
  supports,
  topicFilter,
} from "@/lib/contracts";

describe("NanoMQ 0.25.6 contracts", () => {
  it("accepts a client without the documented but absent recv_msg field", () => {
    const client = clientSchema.parse({
      client_id: "device/01",
      username: null,
      proto_name: "MQTT",
      proto_ver: 5,
      conn_state: "connected",
      keepalive: 60,
      clean_start: true,
    });
    expect(client.username).toBe("");
    expect(client.recv_msg).toBeUndefined();
  });
  it("reads the unwrapped metrics shape and preserves missing values", () => {
    expect(
      parseMetrics({
        cpuinfo: "2.50%",
        memory: "1048576",
        connections: 3,
        metrics: [],
      }),
    ).toEqual({ cpu_usage: 2.5, memory_usage: 1048576, connections_count: 3 });
    expect(parseMetrics({ memory: "unknown" })).toEqual({});
  });
  it("parses finite global Prometheus values without confusing bridge labels", () => {
    expect(
      parsePrometheus(
        '# HELP x\nnanomq_messages_received 100\nnanomq_cpu_usage 1.2e+1\nnanomq_memory_usage NaN\nnanomq_rx{bridge="test"} 33\n',
      ),
    ).toEqual({ messages_received: 100, cpu_usage: 12 });
  });
  it("allows zero-byte MQTT payloads, validates topics and preserves properties", () => {
    expect(
      publishSchema.parse({
        topic: "factory/01",
        payload: "",
        qos: 1,
        retain: true,
        properties: { content_type: "text/plain" },
      }).payload,
    ).toBe("");
    for (const topic of ["", "a/+", "a/#", "a\0b"])
      expect(
        publishSchema.safeParse({ topic, payload: "x", qos: 0, retain: false })
          .success,
      ).toBe(false);
  });
  it.each(["factory/+/temp", "factory/#", "/", "$share/group/factory/#"])(
    "accepts legal topic filter %s",
    (topic) => expect(topicFilter.safeParse(topic).success).toBe(true),
  );
  it.each([
    "",
    "a/#/b",
    "a+b",
    "$share//a",
    "$share/group",
    "$share/+/a",
    "a\0",
  ])("rejects illegal topic filter %s", (topic) =>
    expect(topicFilter.safeParse(topic).success).toBe(false),
  );
  it("handles counter resets and missing intervals without manufacturing rates", () => {
    expect(rate(10, 20, 5)).toBe(2);
    expect(rate(20, 10, 5)).toBeUndefined();
    expect(rate(undefined, 20, 5)).toBeUndefined();
    expect(rate(1, 2, 0)).toBeUndefined();
  });
  it("rejects invalid config bounds and ignores read-only hot reload flags", () => {
    const valid = {
      property_size: 32,
      max_packet_size: 10240,
      client_max_packet_size: 10240,
      msq_len: 1024,
      qos_duration: 10,
      keepalive_backoff: 1.5,
      allow_anonymous: true,
    };
    expect(reloadSchema.parse({ ...valid, bridge_mode: false })).toEqual(valid);
    expect(
      reloadSchema.safeParse({ ...valid, max_packet_size: -1 }).success,
    ).toBe(false);
    expect(reloadSchema.safeParse({ ...valid, msq_len: 1.2 }).success).toBe(
      false,
    );
  });
  it("normalizes the endpoint registry's trailing slash", () =>
    expect(
      supports(
        [{ path: "/reload/", method: "POST", name: "reload", descr: "" }],
        "POST",
        "/reload",
      ),
    ).toBe(true));
});
it("validates MQTT 5 property bounds and binary Base64 input", () => {
  const input = {
    topic: "binary",
    payload: "AP8=",
    qos: 1,
    retain: false,
    decoding: "base64",
  };
  expect(publishSchema.safeParse(input).success).toBe(true);
  expect(
    publishSchema.safeParse({ ...input, payload: "not-base64" }).success,
  ).toBe(false);
  expect(
    publishSchema.safeParse({
      ...input,
      properties: { message_expiry_interval: -1 },
    }).success,
  ).toBe(false);
  expect(
    publishSchema.safeParse({
      ...input,
      properties: {
        content_type: "application/octet-stream",
        user_properties: { count: 2, flag: true },
      },
    }).success,
  ).toBe(true);
});
