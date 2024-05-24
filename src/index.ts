import { createSchema, createYoga } from "graphql-yoga";
import { resolvers, typeDefs } from "./schema";

const yoga = createYoga({
  graphqlEndpoint: "/api",
  schema: createSchema({ typeDefs, resolvers }),
});

const server = Bun.serve({
  fetch: yoga,
});

const endpointUrl = new URL(
  yoga.graphqlEndpoint,
  `http://${server.hostname}:${server.port}`,
);

console.info(`🚀 Server is running on ${endpointUrl.href}`);

export default server;
