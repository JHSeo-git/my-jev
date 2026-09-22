import { describe, expect, test } from "bun:test";
import { experimental_evaluate as evaluate } from "ai";
import { Experimental_EvaluationMockModelV4 } from "ai/test";
import { examples } from "../src/app/api/example/[example]/examples";

describe("example contracts", () => {
  test("cities provide ten named English descriptions and a five-level score rubric", () => {
    expect(examples.cities.samples.map((sample) => sample.state.city)).toEqual([
      "Seoul",
      "Busan",
      "Daegu",
      "Incheon",
      "Gwangju",
      "Daejeon",
      "Ulsan",
      "Sejong",
      "Changwon",
      "Cheongju",
    ]);
    for (const sample of examples.cities.samples) {
      expect(sample.label).toBe(sample.state.city);
      expect(sample.state.description.length).toBeGreaterThan(0);
      expect(sample.state.description).toMatch(/^[\x20-\x7e]+$/);
    }
    expect(examples.cities.questions.livability.type).toBe("score");
    expect(examples.cities.questions.livability.criteria).toHaveLength(5);
  });

  test("city evaluations preserve fractional scores and all five probabilities", async () => {
    const model = new Experimental_EvaluationMockModelV4({
      doEvaluate: async ({ state, questions }) => {
        expect(state).toEqual(examples.cities.samples[0].state);
        expect(questions).toEqual(examples.cities.questions);
        return {
          answers: {
            livability: {
              type: "score",
              score: 3.25,
              probabilities: { "0": 0, "1": 0, "2": 0, "3": 0.75, "4": 0.25 },
            },
          },
          usage: { inputTokens: 42, outputTokens: 0 },
          warnings: [],
        };
      },
    });
    const result = await evaluate({
      model,
      state: examples.cities.samples[0].state,
      questions: examples.cities.questions,
    });
    expect(result.answers.livability.score).toBe(3.25);
    expect(result.answers.livability.probabilities).toEqual({
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0.75,
      "4": 0.25,
    });
  });

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
