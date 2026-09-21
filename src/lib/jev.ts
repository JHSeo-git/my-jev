import "server-only";

import {
  experimental_evaluate as evaluate,
  type Experimental_EvaluationQuestion,
  type Experimental_EvaluationResult,
} from "ai";

export type JevState = Parameters<typeof evaluate>[0]["state"];
export type JevQuestions = Record<string, Experimental_EvaluationQuestion>;

export type JevResult<Q extends JevQuestions = JevQuestions> = Pick<
  Experimental_EvaluationResult<Q>,
  "answers" | "rounding"
> & {
  model: string;
  durationMs: number;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
};

export type EvaluateInput<Q extends JevQuestions = JevQuestions> = {
  state: JevState;
  questions: Q;
  abortSignal?: AbortSignal;
};

export class MissingGatewayKeyError extends Error {
  constructor() {
    super("Set AI_GATEWAY_API_KEY in .env.local or .env.");
  }
}

export async function evaluateJev<const Q extends JevQuestions>({
  state,
  questions,
  abortSignal,
}: EvaluateInput<Q>): Promise<JevResult<Q>> {
  if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    throw new MissingGatewayKeyError();
  }

  const model = "typesafe-ai/jev";
  const startedAt = performance.now();
  const timeout = AbortSignal.timeout(30_000);
  const result = await evaluate({
    model,
    state,
    questions,
    maxRetries: 0,
    abortSignal: abortSignal
      ? AbortSignal.any([abortSignal, timeout])
      : timeout,
  });

  return {
    model,
    answers: result.answers,
    rounding: result.rounding,
    usage: {
      inputTokens: result.usage.inputTokens ?? null,
      outputTokens: result.usage.outputTokens ?? null,
      totalTokens: result.usage.totalTokens ?? null,
    },
    durationMs: Math.round(performance.now() - startedAt),
  };
}
