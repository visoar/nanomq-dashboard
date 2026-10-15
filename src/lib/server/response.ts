import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { BrokerError } from "./broker";
export function errorResponse(error: unknown) {
  if (error instanceof BrokerError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        issues: error.issues,
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Request failed" },
    { status: 400 },
  );
}
