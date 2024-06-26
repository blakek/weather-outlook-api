import { createYoga } from "graphql-yoga";
import { schema } from "./schema";

const yoga = createYoga({
  graphqlEndpoint: "/api/graphql",
  landingPage: false,
  schema,
});

const server = Bun.serve({
  fetch: (req: Request) => {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/nadocast-proxy")) {
      // Proxies the HTTP-only website images to HTTPS
      const upstreamUrl = new URL(
        url.pathname.replace("/api/nadocast-proxy", "http://data.nadocast.com"),
      );

      return fetch(upstreamUrl.href);
    }

    return yoga(req);
  },
});

const endpointUrl = new URL(
  yoga.graphqlEndpoint,
  `http://${server.hostname}:${server.port}`,
);

console.info(`🚀 Server is running on ${endpointUrl.href}`);
