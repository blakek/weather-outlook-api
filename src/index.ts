import { createSchema, createYoga } from "graphql-yoga";
import { resolvers, typeDefs } from "./schema";

export const config = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false,
  },
};

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
