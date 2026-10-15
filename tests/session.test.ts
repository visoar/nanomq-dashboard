import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  allowedBaseURL,
  cookieOptions,
  MAX_AGE,
  normalizeBaseURL,
  sameOrigin,
  seal,
  unseal,
} from "@/lib/server/session";

const credentials = {
  baseURL: "http://127.0.0.1:8081",
  authType: "basic" as const,
  username: "admin",
  password: "test-secret",
};
beforeEach(() => {
  vi.stubEnv(
    "NANOMQ_SESSION_SECRET",
    "test-session-encryption-key-at-least-32-chars",
  );
  vi.stubEnv("NANOMQ_API_URL", credentials.baseURL);
  vi.stubEnv("NANOMQ_ALLOWED_URLS", "https://broker.example/prefix");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
describe("server-side sessions", () => {
  it("encrypts credentials and rejects tampering", () => {
    const token = seal(credentials);
    expect(token).not.toContain(credentials.password);
    expect(unseal(token)).toEqual(credentials);
    const bytes = Buffer.from(token, "base64url");
    bytes[30] ^= 1;
    expect(unseal(bytes.toString("base64url"))).toBeNull();
  });
  it("expires after 12 hours and rejects an old encryption key", () => {
    vi.useFakeTimers();
    const token = seal(credentials);
    vi.advanceTimersByTime(MAX_AGE * 1000 + 1);
    expect(unseal(token)).toBeNull();
    vi.useRealTimers();
    const fresh = seal(credentials);
    vi.stubEnv(
      "NANOMQ_SESSION_SECRET",
      "another-session-encryption-key-at-least-32",
    );
    expect(unseal(fresh)).toBeNull();
  });
  it("refuses fallback credentials and changed allowlists", () => {
    expect(unseal(undefined)).toBeNull();
    expect(unseal("garbage")).toBeNull();
    const token = seal(credentials);
    vi.stubEnv("NANOMQ_API_URL", "http://elsewhere:8081");
    expect(unseal(token)).toBeNull();
  });
  it("requires a strong production session key", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NANOMQ_SESSION_SECRET", "");
    expect(() => seal(credentials)).toThrow("NANOMQ_SESSION_SECRET");
  });
  it("normalizes API suffixes and permits only configured targets", () => {
    expect(allowedBaseURL("http://127.0.0.1:8081/api/v4/")).toBe(
      credentials.baseURL,
    );
    expect(allowedBaseURL("https://broker.example/prefix/api/v4")).toBe(
      "https://broker.example/prefix",
    );
    for (const value of [
      "http://169.254.169.254",
      "http://127.0.0.1:8082",
      "https://broker.example.evil/prefix",
      "https://broker.example/other",
    ])
      expect(() => allowedBaseURL(value)).toThrow();
    for (const value of [
      "ftp://broker",
      "http://user:secret@broker",
      "http://broker?target=x",
    ])
      expect(() => normalizeBaseURL(value)).toThrow();
  });
  it("checks origins using the browser-facing host and rejects cross-site writes", () => {
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000/api/session", {
          headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      sameOrigin(
        new Request("http://localhost:3000", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toThrow();
    expect(() => sameOrigin(new Request("http://localhost:3000"))).toThrow();
  });
  it("sets HttpOnly and strict SameSite cookies", () => {
    expect(cookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      maxAge: MAX_AGE,
    });
  });
});
