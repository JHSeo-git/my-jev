import { APICallError } from "ai";
import { z } from "zod";
import { examples, isExampleId } from "./examples";
import { evaluateJev, MissingGatewayKeyError } from "@/lib/jev";

export const runtime = "nodejs";
export const maxDuration = 35;

const MAX_REQUEST_BYTES = 32_768;

const exampleRequestSchema = z.strictObject({
  state: z.union([
    z.string().trim().min(1, "Enter the text to evaluate."),
    z
      .record(z.string(), z.json())
      .refine(
        (value) => Object.keys(value).length > 0,
        "The state object must not be empty.",
      ),
    z.array(z.json()).min(1, "The state array must not be empty."),
  ]),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/example/[example]">,
): Promise<Response> {
  const { example } = await context.params;
  if (!isExampleId(example)) {
    return failure(404, "UNKNOWN_EXAMPLE", "Unknown example.");
  }
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  ) {
    return failure(
      415,
      "INVALID_CONTENT_TYPE",
      "Content-Type must be application/json.",
    );
  }

  // Read incrementally so chunked requests obey the same body limit.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_REQUEST_BYTES) {
          await reader.cancel();
          return failure(
            413,
            "BODY_TOO_LARGE",
            "The request body must not exceed 32 KiB.",
          );
        }
        chunks.push(value);
      }
    } catch {
      return failure(400, "INVALID_BODY", "Could not read the request body.");
    } finally {
      reader.releaseLock();
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return failure(400, "INVALID_JSON", "Send a valid JSON request body.");
  }
  const parsed = exampleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      400,
      "INVALID_STATE",
      "Provide a non-empty string, JSON object, or array in state. Additional fields are not allowed.",
    );
  }

  try {
    const result = await evaluateJev({
      state: parsed.data.state,
      questions: examples[example].questions,
      abortSignal: request.signal,
    });
    return Response.json(
      { example, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof MissingGatewayKeyError) {
      return failure(503, "MISSING_API_KEY", error.message);
    }
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    ) {
      return failure(
        504,
        "EVALUATION_TIMEOUT",
        "The evaluation was canceled or exceeded the 30-second timeout.",
      );
    }
    const apiError = findApiError(error);
    if (requiresVerification(apiError)) {
      return failure(
        502,
        "GATEWAY_VERIFICATION_REQUIRED",
        "Vercel AI Gateway requires a valid credit card on file. Check the AI Gateway billing settings for your Vercel team.",
      );
    }
    if (apiError?.statusCode === 429) {
      return failure(
        429,
        "RATE_LIMITED",
        "The Gateway rate limit was reached. Please try again later.",
      );
    }
    if ([401, 402, 403].includes(apiError?.statusCode ?? 0)) {
      return failure(
        502,
        "GATEWAY_ACCESS_ERROR",
        "Check the Gateway API key, model access, billing, and available credits.",
      );
    }
    return failure(
      502,
      "EVALUATION_FAILED",
      "Jev evaluation failed. Check the Gateway status and model settings.",
    );
  }
}

function failure(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

function findApiError(error: unknown): APICallError | undefined {
  // Gateway errors wrap the provider's APICallError in cause.
  for (let depth = 0; depth < 5 && error instanceof Error; depth++) {
    if (APICallError.isInstance(error)) return error;
    error = error.cause;
  }
}

function requiresVerification(error: APICallError | undefined): boolean {
  if (!error?.responseBody) return false;
  try {
    return (
      JSON.parse(error.responseBody)?.error?.type ===
      "customer_verification_required"
    );
  } catch {
    return false;
  }
}
