import type { Credentials } from "./session";

export class BrokerError extends Error {
  constructor(
    message: string,
    public status = 502,
    public code?: number,
  ) {
    super(message);
  }
}
export async function brokerRequest(
  credentials: Credentials,
  path: string,
  method = "GET",
  body?: unknown,
  query = "",
) {
  const authorization =
    credentials.authType === "basic"
      ? `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`
      : `Bearer ${credentials.token}`;
  let response: Response;
  try {
    response = await fetch(`${credentials.baseURL}/api/v4${path}${query}`, {
      method,
      headers: {
        Authorization: authorization,
        "Content-Type":
          path === "/config_update" ? "text/plain" : "application/json",
      },
      body:
        body === undefined
          ? undefined
          : path === "/config_update" && typeof body === "string"
            ? body
            : JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new BrokerError(
      "Cannot reach NanoMQ. Check the broker URL, HTTP API and network.",
      503,
    );
  }
  const raw = await response.text();
  if (!response.ok)
    throw new BrokerError(
      response.status === 401
        ? "NanoMQ authentication failed"
        : `NanoMQ returned HTTP ${response.status}`,
      response.status >= 400 && response.status < 500 ? response.status : 502,
    );
  if (path === "/prometheus") {
    if (!raw.includes("nanomq_"))
      throw new BrokerError("Invalid Prometheus response");
    return raw;
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new BrokerError("NanoMQ returned invalid JSON");
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new BrokerError("Invalid NanoMQ response");
  if (typeof data.code === "number" && data.code !== 0)
    throw new BrokerError(
      `NanoMQ rejected the request (code ${data.code})`,
      [103, 104, 105, 116].includes(data.code) ? 401 : 422,
      data.code,
    );
  if (path !== "/metrics" && typeof data.code !== "number")
    throw new BrokerError("Missing NanoMQ response code");
  return data;
}
