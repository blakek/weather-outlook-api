import { createYoga } from "graphql-yoga";
import { schema } from "./schema";

const yoga = createYoga({ schema });

export function GET(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/nadocast-proxy")) {
    // Proxies the HTTP-only website images to HTTPS
    const upstreamUrl = new URL(
      url.pathname.replace("/api/nadocast-proxy", "http://data.nadocast.com"),
    );

    return fetch(upstreamUrl.href);
  }

  return yoga.handleRequest(request, {});
}

export function POST(request: Request) {
  return yoga.handleRequest(request, {});
}
