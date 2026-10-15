import { BrokerError } from "./broker";
export async function readJSON(
  request: Request,
  limit = 1048576,
): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit)
    throw new BrokerError("Request body is too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new BrokerError("JSON body required", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new BrokerError("Request body is too large", 413);
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof BrokerError) throw error;
    throw new BrokerError("Invalid JSON body", 400);
  }
}
