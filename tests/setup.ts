import { mock } from "bun:test";

// Next.js enforces this boundary in builds; Bun tests run only on the server.
mock.module("server-only", () => ({}));
