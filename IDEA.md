# my-jev project outline

## Purpose

Explore TypeSafe AI's Jev through small evaluation examples, then choose a useful application based on the results.

## Stack

- TypeScript and Next.js App Router with the Node.js runtime
- Bun for package management and scripts
- Vercel AI SDK and AI Gateway with `typesafe-ai/jev`

## Evaluation examples

The project is API-only. Each example accepts a state at `POST /api/example/{example}` and evaluates it against predefined questions.

- `boolean`: estimate whether a customer is requesting a refund.
- `choice`: select the department that should handle a request.
- `score`: assess an issue's severity against a rubric.
- `mixed`: evaluate all three question types in one request.
- `cities`: score the livability suggested by English descriptions of 10 Korean cities on a 0–4 scale.

The 23 English samples cover string, object, and array inputs. Run them sequentially with `bun run examples` to inspect answers, probability distributions, token usage, and SDK call duration. Use `bun run examples cities` for the city samples only. City scores assess the supplied descriptions, not an official ranking; see the [scope and sources](./verification/city-example.md).

Keep HTTP handling in `src/app/api/example/[example]/route.ts`, questions and samples in the adjacent `examples.ts`, and Gateway communication in `src/lib/jev.ts`.

## Credentials

Set `AI_GATEWAY_API_KEY` in `.env.local`, `.env`, or the runtime environment. Keep credentials server-side and out of source control; `.env.example` contains only the variable name.

## Verification

Recorded Gateway responses are available for the [English samples](./verification/2026-09-21-en.json) and the [original Korean inputs](./verification/2026-09-21.json). These individual runs verify the examples; broader judgment-quality evaluation needs a separate dataset.

## Next decisions

- The application topic and first product use case
- How to retain results and whether to deploy
- UI requirements for the selected use case

## References

- [Vercel AI Gateway — Jev](https://vercel.com/ai-gateway/models/jev)
