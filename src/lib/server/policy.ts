import { z } from "zod";
import {
  bridgeSubscriptionSchema,
  bridgeUnsubscriptionSchema,
  createRuleSchema,
  publishSchema,
  reloadSchema,
  updateRuleSchema,
} from "../contracts";

const sections = "basic|tls|auth|auth_http|websocket|http_server|sqlite";
export function permitted(method: string, path: string) {
  if (method === "GET")
    return /^\/(?:|brokers|nodes|clients(?:\/[^/]+|\/username\/[^/]+)?|subscriptions(?:\/[^/]+)?|metrics|prometheus|topic-tree|reload|rules(?:\/rule:\d+)?|bridges\/[^/]+|configuration(?:\/(?:basic|tls|auth|auth_http|websocket|http_server|sqlite|bridge|aws_bridge))?)$/.test(
      path,
    );
  if (method === "DELETE") return /^\/rules\/rule:\d+$/.test(path);
  if (method === "PUT") return /^\/rules\/rule:\d+$/.test(path);
  return (
    method === "POST" &&
    (new RegExp(`^/configuration(?:/(?:${sections}))?$`).test(path) ||
      /^\/(mqtt\/(publish|publish_batch)|reload|config_update|rules|bridges\/(switch|sub|unsub)\/[^/]+|ctrl\/(restart|stop))$/.test(
        path,
      ))
  );
}
export function validateBody(path: string, body: unknown) {
  if (path === "/config_update")
    return z
      .object({
        configuration: z
          .string()
          .min(1)
          .max(1048576)
          .refine(
            (value) => value.trim().length > 0,
            "Configuration cannot be empty",
          ),
      })
      .parse(body).configuration;
  if (path === "/mqtt/publish") return publishSchema.parse(body);
  if (path === "/mqtt/publish_batch")
    return publishSchema.array().min(1).max(100).parse(body);
  if (path === "/reload") return z.object({ data: reloadSchema }).parse(body);
  if (path === "/rules") return createRuleSchema.parse(body);
  if (path.startsWith("/rules/")) return updateRuleSchema.parse(body);
  if (path.startsWith("/bridges/sub/"))
    return z
      .object({
        data: z.object({
          subscription: bridgeSubscriptionSchema.array().min(1).max(100),
        }),
      })
      .parse(body);
  if (path.startsWith("/bridges/unsub/"))
    return z
      .object({
        data: z.object({
          unsubscription: bridgeUnsubscriptionSchema.array().min(1).max(100),
        }),
      })
      .parse(body);
  if (path.startsWith("/bridges/switch/"))
    return z
      .object({ data: z.object({ bridge_switch: z.boolean() }) })
      .parse(body);
  if (path.startsWith("/configuration")) {
    const input = z
      .object({
        data: z
          .record(z.string(), z.unknown())
          .refine((v) => Object.keys(v).length > 0),
      })
      .parse(body);
    const section = path.split("/")[2];
    if (section && !(section in input.data))
      throw new Error(`Missing configuration section: ${section}`);
    for (const [key, value] of Object.entries(input.data)) {
      if (!sections.split("|").includes(key))
        throw new Error(`Unsupported configuration section: ${key}`);
      if (
        value === null ||
        typeof value !== "object" ||
        (key === "auth" ? !Array.isArray(value) : Array.isArray(value))
      )
        throw new Error(`Invalid configuration section: ${key}`);
    }
    return input;
  }
  return undefined;
}
