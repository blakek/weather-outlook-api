import { createSchema, createYoga } from "graphql-yoga";
import { resolvers, typeDefs } from "./schema";

const yoga = createYoga({
  graphqlEndpoint: "/api",
  schema: createSchema({ typeDefs, resolvers }),
});

const server = Bun.serve({
  async fetch(request) {
    // HACK: Both Vercel and GraphQL Yoga try to parse the body.
    const rawBody = await request.text();
    const revertedRequest = new Request(request, {
      body: rawBody,
    });

    return yoga.handleRequest(revertedRequest, {});
  },
});

const endpointUrl = new URL(
  yoga.graphqlEndpoint,
  `http://${server.hostname}:${server.port}`,
);

console.info(`🚀 Server is running on ${endpointUrl.href}`);

// HACK: Vercel wants the server to be the default export but Bun doesn't.
const defaultExport = server.hostname === "localhost" ? undefined : server;
export default defaultExport;
