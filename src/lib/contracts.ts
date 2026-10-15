import { z } from "zod";

export const brokerSchema = z.object({
  datetime: z.string().optional(),
  node_status: z.string(),
  sysdescr: z.string().optional(),
  uptime: z.string(),
  version: z.string(),
});
export const nodeSchema = z.object({
  connections: z.number(),
  node_status: z.string(),
  uptime: z.string(),
  version: z.string(),
});
export const clientSchema = z.object({
  client_id: z.string(),
  username: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  proto_name: z.string(),
  proto_ver: z.number(),
  keepalive: z.number(),
  clean_start: z.boolean(),
  conn_state: z.enum(["connected", "idle", "disconnected"]),
  recv_msg: z.number().optional(),
  will_topic: z.string().optional(),
  will_msg: z.string().optional(),
});
export const subscriptionSchema = z.object({
  clientid: z.string(),
  topic: z.string(),
  qos: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});
export const endpointSchema = z.object({
  path: z.string(),
  method: z.string(),
  name: z.string(),
  descr: z.string(),
});
export const topicNodeSchema = z.object({
  topic: z.string(),
  cld_cnt: z.number(),
  clientid: z.array(z.string()).optional(),
});
export const reloadSchema = z.object({
  property_size: z.number().int().min(1).max(2147483647),
  max_packet_size: z.number().int().min(1).max(4194303),
  client_max_packet_size: z.number().int().min(1).max(4194303),
  msq_len: z.number().int().min(1).max(2147483647),
  qos_duration: z.number().int().min(1).max(4294967295),
  keepalive_backoff: z.number().positive().max(1000000),
  allow_anonymous: z.boolean(),
});
export const topicFilter = z
  .string()
  .min(1)
  .refine((value) => {
    if (value.includes("\0") || new TextEncoder().encode(value).length > 65535)
      return false;
    const parts = value.startsWith("$share/")
      ? value.split("/").slice(2)
      : value.split("/");
    if (value.startsWith("$share/")) {
      const group = value.split("/")[1];
      if (!group || /[+#]/.test(group) || !parts.length) return false;
    }
    return parts.every(
      (part, i) =>
        (!part.includes("+") || part === "+") &&
        (!part.includes("#") || (part === "#" && i === parts.length - 1)),
    );
  }, "Invalid MQTT topic filter");
const mqttString = z
  .string()
  .refine(
    (value) =>
      !value.includes("\0") && new TextEncoder().encode(value).length <= 65535,
    "Invalid MQTT UTF-8 string",
  );
export const mqttPropertiesSchema = z.strictObject({
  payload_format_indicator: z.union([z.literal(0), z.literal(1)]).optional(),
  message_expiry_interval: z.number().int().min(0).max(4294967295).optional(),
  response_topic: mqttString
    .refine(
      (value) => value.length > 0 && !/[+#]/.test(value),
      "Invalid response topic",
    )
    .optional(),
  correlation_data: mqttString.optional(),
  subscription_identifier: z.number().int().min(1).max(268435455).optional(),
  content_type: mqttString.optional(),
  user_properties: z
    .record(mqttString, z.union([mqttString, z.number(), z.boolean()]))
    .optional(),
});
export const publishSchema = z
  .object({
    topic: z
      .string()
      .min(1)
      .refine(
        (v) => !/[+#\0]/.test(v) && new TextEncoder().encode(v).length <= 65535,
        "Invalid publish topic",
      ),
    payload: z
      .string()
      .refine(
        (value) => !value.includes("\0"),
        "Use Base64 decoding for binary payloads",
      ),
    qos: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    retain: z.boolean().default(false),
    clientid: z.string().optional(),
    encoding: z.enum(["plain", "base64"]).default("plain"),
    decoding: z.enum(["plain", "base64"]).default("plain"),
    properties: mqttPropertiesSchema.optional(),
  })
  .refine(
    (value) =>
      value.decoding !== "base64" ||
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        value.payload,
      ),
    "Payload must be valid Base64",
  );
export const subscribeSchema = z.object({
  clientid: z.string().min(1),
  topic: topicFilter,
  qos: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});
export const unsubscribeSchema = subscribeSchema.omit({ qos: true });
export type Broker = z.infer<typeof brokerSchema>;
export type BrokerNode = z.infer<typeof nodeSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type Endpoint = z.infer<typeof endpointSchema>;
export type TopicNode = z.infer<typeof topicNodeSchema>;
export type ReloadConfig = z.infer<typeof reloadSchema>;
export type Publish = z.infer<typeof publishSchema>;
export type Metrics = Record<string, number>;
export type SessionInfo = {
  baseURL: string;
  username: string;
  authType: "basic" | "jwt";
};

export function parsePrometheus(text: string): Metrics {
  const result: Metrics = {};
  for (const line of text.split("\n")) {
    const match = line.match(
      /^(nanomq_[a-zA-Z0-9_]+)\s+([-+\d.eE]+)(?:\s+\d+)?\s*$/,
    );
    if (match && Number.isFinite(Number(match[2])))
      result[match[1].slice(7)] = Number(match[2]);
  }
  return result;
}
export function parseMetrics(value: unknown): Metrics {
  const raw = z
    .object({
      cpuinfo: z.union([z.string(), z.number()]).optional(),
      memory: z.union([z.string(), z.number()]).optional(),
      connections: z.number().optional(),
    })
    .parse(value);
  const result: Metrics = {};
  const cpu =
    raw.cpuinfo === undefined
      ? NaN
      : Number(String(raw.cpuinfo).replace(/%$/, ""));
  const memory = raw.memory === undefined ? NaN : Number(raw.memory);
  if (Number.isFinite(cpu)) result.cpu_usage = cpu;
  if (Number.isFinite(memory)) result.memory_usage = memory;
  if (raw.connections !== undefined) result.connections_count = raw.connections;
  return result;
}
export function rate(
  previous: number | undefined,
  current: number | undefined,
  seconds: number,
): number | undefined {
  return previous === undefined ||
    current === undefined ||
    seconds <= 0 ||
    current < previous
    ? undefined
    : (current - previous) / seconds;
}
export function supports(
  endpoints: Endpoint[],
  method: string,
  path: string,
): boolean {
  return endpoints.some(
    (e) =>
      e.method === method &&
      e.path.replace(/^\/api\/v4/, "").replace(/\/$/, "") ===
        path.replace(/\/$/, ""),
  );
}

export const ruleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  rawsql: z.string(),
  enabled: z.boolean(),
  name: z.string().nullable().optional(),
});
export type Rule = z.infer<typeof ruleSchema>;
export const actionSchema = z
  .object({
    name: z.enum(["repub", "sqlite", "mysql", "postgresql", "timescaledb"]),
    params: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean()]),
    ),
  })
  .superRefine((action, ctx) => {
    const fields =
      action.name === "repub"
        ? ["topic", "address"]
        : action.name === "sqlite"
          ? ["table"]
          : ["host", "username", "password", "table"];
    for (const field of fields)
      if (
        typeof action.params[field] !== "string" ||
        (field !== "password" && !action.params[field])
      )
        ctx.addIssue({
          code: "custom",
          path: ["params", field],
          message: "Required string",
        });
    for (const [key, value] of Object.entries(action.params)) {
      const numeric = ["proto_ver", "keepalive"].includes(key);
      if (
        (key === "proto_ver" && ![3, 4, 5].includes(Number(value))) ||
        (key === "keepalive" &&
          (!Number.isInteger(value) ||
            Number(value) < 0 ||
            Number(value) > 65535))
      )
        ctx.addIssue({
          code: "custom",
          path: ["params", key],
          message: "Invalid MQTT parameter",
        });
      if (
        (numeric && typeof value !== "number") ||
        (!numeric && typeof value !== "string")
      )
        ctx.addIssue({
          code: "custom",
          path: ["params", key],
          message: numeric ? "Expected number" : "Expected string",
        });
    }
  });
export const createRuleSchema = z.object({
  rawsql: z.string().min(1),
  actions: actionSchema.array().length(1),
});
export const updateRuleSchema = z
  .object({
    rawsql: z.string().min(1).optional(),
    enabled: z.boolean().optional(),
    actions: actionSchema.array().length(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0);
export const bridgeSchema = z
  .object({
    name: z.string(),
    enable: z.boolean(),
    parallel: z.number().optional(),
    connector: z.record(z.string(), z.unknown()),
    forwards: z.array(z.record(z.string(), z.unknown())).optional(),
    subscription: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();
export type Bridge = z.infer<typeof bridgeSchema>;
export const bridgeConfigSchema = z.object({
  bridge: z.object({ nodes: bridgeSchema.array() }),
});
