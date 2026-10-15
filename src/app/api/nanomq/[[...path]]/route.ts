import { type NextRequest, NextResponse } from "next/server";
import { readJSON } from "@/lib/server/body";
import { brokerRequest } from "@/lib/server/broker";
import { permitted, validateBody } from "@/lib/server/policy";
import { errorResponse } from "@/lib/server/response";
import { COOKIE, sameOrigin, unseal } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
async function handle(request: NextRequest, context: Context) {
  try {
    const credentials = unseal(request.cookies.get(COOKIE)?.value);
    if (!credentials)
      return NextResponse.json(
        { error: "Session expired. Reconnect to NanoMQ." },
        { status: 401 },
      );
    if (request.method !== "GET") sameOrigin(request);
    const { path: segments = [] } = await context.params;
    if (segments.some((s) => !s || s === "." || s === ".." || /[\\\0]/.test(s)))
      return NextResponse.json({ error: "Invalid API path" }, { status: 400 });
    const path = `/${segments.map((segment, index) => (segments[0] === "rules" && index === 1 && /^rule:\d+$/.test(segment) ? segment : encodeURIComponent(segment))).join("/")}`;
    if (!permitted(request.method, path))
      return NextResponse.json(
        { error: "API operation is not supported by this dashboard" },
        { status: 405 },
      );
    if (Number(request.headers.get("content-length")) > 1048576)
      return NextResponse.json(
        { error: "Request exceeds 1 MiB" },
        { status: 413 },
      );
    const body =
      ["GET", "DELETE"].includes(request.method) || path.startsWith("/ctrl/")
        ? undefined
        : validateBody(path, await readJSON(request));
    const result = await brokerRequest(
      credentials,
      path,
      request.method,
      body,
      request.nextUrl.search,
    );
    return typeof result === "string"
      ? new NextResponse(result, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      : NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
