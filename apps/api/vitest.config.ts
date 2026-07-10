import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NDJAR_DATABASE_MODE: "fixture",
    },
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/*e2e-spec.ts"],
  },
});
