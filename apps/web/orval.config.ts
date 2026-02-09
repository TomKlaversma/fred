export default {
  fred: {
    input: {
      target: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/docs-json`
        : "http://localhost:3001/docs-json",
    },
    output: {
      mode: "tags-split" as const,
      target: "./generated/api",
      client: "react-query" as const,
      override: {
        mutator: {
          path: "./lib/api-client.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
};
