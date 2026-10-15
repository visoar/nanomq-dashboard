import type { z } from "zod";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  const data = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok)
    throw new ApiError(
      typeof data === "object" && data?.error
        ? data.error
        : `HTTP ${response.status}`,
      response.status,
    );
  return data as T;
}
export async function read<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const result = await request<{ data: unknown }>(`/api/nanomq${path}`, {
    signal,
  });
  return schema.parse(result.data);
}
export function mutate(path: string, data?: unknown, method = "POST") {
  return request(`/api/nanomq${path}`, {
    method,
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}
