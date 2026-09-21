import { describe, expect, test } from "bun:test";
import { experimental_evaluate as evaluate } from "ai";
import { Experimental_EvaluationMockModelV4 } from "ai/test";
import { examples } from "../src/app/api/example/[example]/examples";

describe("example contracts", () => {
  test("mixed questions preserve boolean probability, choice keys and fractional score", async () => {
    const model = new Experimental_EvaluationMockModelV4({
      doEvaluate: async ({ state, questions }) => {
        expect(state).toEqual(examples.mixed.samples[0].state);
        expect(Object.keys(questions)).toEqual([
          "requestsRefund",
          "department",
          "severity",
        ]);
        return {
          answers: {
            requestsRefund: { type: "boolean", probability: 0.85 },
            department: {
              type: "choice",
              choice: "billing",
              probabilities: {
                billing: 0.7,
                technical: 0.2,
                account: 0.05,
                review: 0.05,
              },
            },
            severity: {
              type: "score",
              score: 1.5,
              probabilities: { "0": 0, "1": 0.5, "2": 0.5, "3": 0 },
            },
          },
          usage: { inputTokens: 42, outputTokens: 0 },
          warnings: [],
        };
      },
    });
    const result = await evaluate({
      model,
      state: examples.mixed.samples[0].state,
      questions: examples.mixed.questions,
    });
    const department: "billing" | "technical" | "account" | "review" =
      result.answers.department.choice;
    expect(department).toBe("billing");
    expect(result.answers.requestsRefund.probability).toBe(0.85);
    expect(result.answers.severity.score).toBe(1.5);
    expect(result.usage.totalTokens).toBe(42);
  });
});
