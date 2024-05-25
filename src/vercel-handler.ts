import { createYoga } from "graphql-yoga";
import { schema } from "./schema";

export const config = {
  runtime: "nodejs",
};

const yoga = createYoga({ schema });

export function GET(request: Request) {
  return yoga.handleRequest(request, {});
}

export function POST(request: Request) {
  return yoga.handleRequest(request, {});
}
