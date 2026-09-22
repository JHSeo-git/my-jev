import {
  exampleIds,
  examples,
  isExampleId,
} from "../src/app/api/example/[example]/examples";
import type { JevResult } from "../src/lib/jev";

const requested = process.argv[2] || "all";
let selectedExampleIds = exampleIds;

if (requested !== "all") {
  if (!isExampleId(requested)) {
    console.error(
      "Usage: bun run examples [boolean|choice|score|mixed|cities|all]",
    );
    process.exit(1);
  }

  selectedExampleIds = [requested];
}

const baseUrl = new URL(
  process.env.EXAMPLE_BASE_URL ?? "http://127.0.0.1:3000",
);
if (!["127.0.0.1", "localhost", "[::1]"].includes(baseUrl.hostname)) {
  console.error("EXAMPLE_BASE_URL must point to a local server.");
  process.exit(1);
}

process.exitCode = 0;
for (const exampleId of selectedExampleIds) {
  const example = examples[exampleId];
  const url = new URL(`/api/example/${exampleId}`, baseUrl);

  for (const sample of example.samples) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: sample.state }),
        signal: AbortSignal.timeout(40_000),
      });
      const data = await response.json();

      if (!response.ok) {
        process.exitCode = 1;
        console.error(
          `${exampleId} / ${sample.label}: HTTP ${response.status} · ${data.error?.message ?? "Request failed"}`,
        );

        const errorCode = data.error?.code;
        if (
          errorCode === "MISSING_API_KEY" ||
          errorCode === "GATEWAY_ACCESS_ERROR" ||
          errorCode === "GATEWAY_VERIFICATION_REQUIRED" ||
          errorCode === "RATE_LIMITED"
        ) {
          process.exit(1);
        }

        continue;
      }

      const result = data as JevResult;
      const output = {
        example: exampleId,
        sample: sample.label,
        ...result,
      };
      console.log(JSON.stringify(output, null, 2));
    } catch {
      process.exitCode = 1;
      console.error(
        `${exampleId} / ${sample.label}: No response received. Start the server with bun dev first.`,
      );
    }
  }
}
