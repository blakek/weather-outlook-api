import { createYoga } from "graphql-yoga";
import { schema } from "./schema";

const yoga = createYoga({
  graphqlEndpoint: "/api/graphql",
  schema,
});

const server = Bun.serve({
  fetch: yoga,
});

const endpointUrl = new URL(
  yoga.graphqlEndpoint,
  `http://${server.hostname}:${server.port}`,
);

console.info(`🚀 Server is running on ${endpointUrl.href}`);
