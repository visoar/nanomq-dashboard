import { type NextRequest, NextResponse } from "next/server";
import { brokerSchema } from "@/lib/contracts";
import { readJSON } from "@/lib/server/body";
import { brokerRequest } from "@/lib/server/broker";
import { errorResponse } from "@/lib/server/response";
import {
  allowedBaseURL,
  COOKIE,
  cookieOptions,
  credentialsSchema,
  defaultBaseURL,
  sameOrigin,
  seal,
  unseal,
} from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const credentials = unseal(request.cookies.get(COOKIE)?.value);
  return NextResponse.json({
    session: credentials
      ? {
          baseURL: credentials.baseURL,
          username:
            credentials.authType === "basic" ? credentials.username : "JWT",
          authType: credentials.authType,
        }
      : null,
    defaultBaseURL: defaultBaseURL(),
  });
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const credentials = credentialsSchema.parse(await readJSON(request, 8192));
    credentials.baseURL = allowedBaseURL(credentials.baseURL);
    const result = await brokerRequest(credentials, "/brokers");
    brokerSchema
      .array()
      .min(1)
      .parse(typeof result === "string" ? null : result.data);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE, seal(credentials), cookieOptions());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
