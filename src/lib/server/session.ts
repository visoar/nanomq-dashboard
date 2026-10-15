import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { z } from "zod";

export const COOKIE = "nanomq-session";
export const MAX_AGE = 12 * 60 * 60;
export const credentialsSchema = z.discriminatedUnion("authType", [
  z.object({
    baseURL: z.string().max(1024),
    authType: z.literal("basic"),
    username: z
      .string()
      .min(1)
      .max(128)
      .refine((v) => !v.includes(":")),
    password: z.string().max(512),
  }),
  z.object({
    baseURL: z.string().max(1024),
    authType: z.literal("jwt"),
    token: z.string().min(1).max(2048),
  }),
]);
export type Credentials = z.infer<typeof credentialsSchema>;
const developmentKey = randomBytes(32);
function key() {
  const secret = process.env.NANOMQ_SESSION_SECRET;
  if (secret && secret.length >= 32)
    return createHash("sha256").update(secret).digest();
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "NANOMQ_SESSION_SECRET must contain at least 32 characters",
    );
  return developmentKey;
}
export function normalizeBaseURL(input: string) {
  const url = new URL(input);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid broker URL");
  const path = url.pathname.replace(/\/+$/, "").replace(/\/api\/v4$/, "");
  return `${url.origin}${path}`;
}
export function defaultBaseURL() {
  return normalizeBaseURL(
    process.env.NANOMQ_API_URL || "http://127.0.0.1:8081",
  );
}
export function allowedBaseURL(input: string) {
  const normalized = normalizeBaseURL(input);
  const allowed = [
    defaultBaseURL(),
    ...(process.env.NANOMQ_ALLOWED_URLS || "")
      .split(",")
      .filter(Boolean)
      .map((v) => normalizeBaseURL(v.trim())),
  ];
  if (!allowed.includes(normalized))
    throw new Error("Broker URL is not in NANOMQ_ALLOWED_URLS");
  return normalized;
}
export function seal(credentials: Credentials) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = Buffer.concat([
    cipher.update(
      JSON.stringify({ credentials, expires: Date.now() + MAX_AGE * 1000 }),
    ),
    cipher.final(),
  ]);
  const token = Buffer.concat([iv, cipher.getAuthTag(), payload]).toString(
    "base64url",
  );
  if (token.length > 3800)
    throw new Error("Credentials are too large for a browser session");
  return token;
}
export function unseal(token: string | undefined): Credentials | null {
  if (!token || token.length > 6000) return null;
  try {
    const bytes = Buffer.from(token, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      bytes.subarray(0, 12),
    );
    decipher.setAuthTag(bytes.subarray(12, 28));
    const data = JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString(),
    );
    if (typeof data.expires !== "number" || data.expires <= Date.now())
      return null;
    const credentials = credentialsSchema.parse(data.credentials);
    credentials.baseURL = allowedBaseURL(credentials.baseURL);
    return credentials;
  } catch {
    return null;
  }
}
export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure:
      process.env.NANOMQ_SECURE_COOKIE === "true" ||
      (process.env.NANOMQ_SECURE_COOKIE !== "false" &&
        process.env.NODE_ENV === "production"),
    path: "/",
    maxAge: MAX_AGE,
  };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol =
    request.headers.get("x-forwarded-proto") === "https"
      ? "https:"
      : url.protocol;
  if (!origin || origin !== `${protocol}//${host}`)
    throw new Error("Same-origin request required");
}
