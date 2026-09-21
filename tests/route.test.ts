import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { APICallError } from "ai";
import {
  examples,
  exampleIds,
} from "../src/app/api/example/[example]/examples";
import { POST } from "../src/app/api/example/[example]/route";
import * as jev from "../src/lib/jev";
import type { EvaluateInput, JevResult } from "../src/lib/jev";

const fixture: JevResult = {
  model: "typesafe-ai/jev",
  answers: { requestsRefund: { type: "boolean", probability: 0.92 } },
  usage: { inputTokens: 20, outputTokens: 0, totalTokens: 20 },
  durationMs: 10,
  rounding: undefined,
};

afterEach(() => mock.restore());

function callRoute(
  request: Request,
  example: string,
  evaluate: (input: EvaluateInput) => Promise<JevResult> = async () => fixture,
) {
  const target: { evaluateJev: (input: EvaluateInput) => Promise<JevResult> } =
    jev;
  spyOn(target, "evaluateJev").mockImplementation(evaluate);
  return POST(request, { params: Promise.resolve({ example }) });
}

for (const id of exampleIds) {
  test(`${id}: all samples are accepted by the route`, async () => {
    for (const sample of examples[id].samples) {
      const response = await callRoute(request({ state: sample.state }), id);
      expect(response.status).toBe(200);
    }
  });
}

function request(body: unknown) {
  return new Request("http://localhost/api/example/boolean", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("validated input and fixed questions reach the evaluator, with cancellation", async () => {
  const evaluate = mock<(input: EvaluateInput) => Promise<JevResult>>(
    async () => fixture,
  );
  const req = request({ state: "  Please issue a refund.  " });
  const response = await callRoute(req, "boolean", evaluate);
  expect(response.status).toBe(200);
  expect(evaluate).toHaveBeenCalledWith({
    state: "Please issue a refund.",
    questions: examples.boolean.questions,
    abortSignal: req.signal,
  });
  expect(await response.json()).toEqual({
    example: "boolean",
    ...JSON.parse(JSON.stringify(fixture)),
  });
  expect(response.headers.get("cache-control")).toBe("no-store");
});

for (const example of ["unknown", "constructor", "__proto__"]) {
  test(`rejects unknown/inherited example: ${example}`, async () => {
    const evaluate = mock(async () => fixture);
    expect(
      (await callRoute(request({ state: "hello" }), example, evaluate)).status,
    ).toBe(404);
    expect(evaluate).not.toHaveBeenCalled();
  });
}

for (const body of [
  {},
  { state: " " },
  { state: null },
  { state: 3 },
  { state: true },
  { state: [] },
  { state: {} },
  { state: "hello", model: "override" },
]) {
  test(`invalid request never calls Jev: ${JSON.stringify(body)}`, async () => {
    const evaluate = mock(async () => fixture);
    expect((await callRoute(request(body), "boolean", evaluate)).status).toBe(
      400,
    );
    expect(evaluate).not.toHaveBeenCalled();
  });
}

test("accepts structured state without converting arrays into batches", async () => {
  const state = [{ role: "customer", text: "Please issue a refund." }];
  const evaluate = mock<(input: EvaluateInput) => Promise<JevResult>>(
    async () => fixture,
  );
  expect((await callRoute(request({ state }), "mixed", evaluate)).status).toBe(
    200,
  );
  expect(evaluate.mock.calls[0][0].state).toEqual(state);
  expect(evaluate.mock.calls[0][0].questions).toEqual(examples.mixed.questions);
});

test("rejects malformed JSON and non-JSON requests", async () => {
  const evaluate = mock(async () => fixture);
  const malformed = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  expect((await callRoute(malformed, "boolean", evaluate)).status).toBe(400);
  const plain = new Request("http://localhost", {
    method: "POST",
    body: "hello",
  });
  expect((await callRoute(plain, "boolean", evaluate)).status).toBe(415);
  expect(evaluate).not.toHaveBeenCalled();
});

test("enforces UTF-8 byte limit even without a Content-Length header", async () => {
  const evaluate = mock(async () => fixture);
  const response = await callRoute(
    request({ state: "\u20ac".repeat(32_768 / 2) }),
    "boolean",
    evaluate,
  );
  expect(response.status).toBe(413);
  expect(evaluate).not.toHaveBeenCalled();
});

const failures = [
  {
    error: new Error("Gateway wrapper", {
      cause: new APICallError({
        message: "private upstream detail",
        url: "https://example.com",
        requestBodyValues: {},
        statusCode: 403,
        responseBody: JSON.stringify({
          error: { type: "customer_verification_required" },
        }),
      }),
    }),
    status: 502,
    code: "GATEWAY_VERIFICATION_REQUIRED",
  },
  {
    error: new jev.MissingGatewayKeyError(),
    status: 503,
    code: "MISSING_API_KEY",
  },
  {
    error: new DOMException("private detail", "TimeoutError"),
    status: 504,
    code: "EVALUATION_TIMEOUT",
  },
  {
    error: new Error("private upstream detail"),
    status: 502,
    code: "EVALUATION_FAILED",
  },
  ...[401, 402, 403, 429, 500].map((statusCode) => ({
    error: new APICallError({
      message: "private upstream detail",
      url: "https://example.com",
      requestBodyValues: {},
      statusCode,
      responseBody: "private upstream detail",
    }),
    status: statusCode === 429 ? 429 : 502,
    code:
      statusCode === 429
        ? "RATE_LIMITED"
        : statusCode === 500
          ? "EVALUATION_FAILED"
          : "GATEWAY_ACCESS_ERROR",
  })),
];

for (const failure of failures) {
  test(`maps ${failure.code} to HTTP ${failure.status} without exposing upstream content`, async () => {
    const response = await callRoute(
      request({ state: "hello" }),
      "boolean",
      async () => {
        throw failure.error;
      },
    );
    expect(response.status).toBe(failure.status);
    const body = await response.json();
    expect(body.error.code).toBe(failure.code);
    expect(JSON.stringify(body)).not.toContain("private");
  });
}
