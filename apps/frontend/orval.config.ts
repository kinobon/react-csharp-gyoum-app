import { defineConfig } from "orval";

export default defineConfig({
  factoryTraining: {
    input: "./openapi/api.json",
    output: {
      target: "./src/api/generated/weather.ts",
      schemas: "./src/api/generated/models",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: "/api",
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
          forceSuccessResponse: true,
        },
      },
    },
  },
});
