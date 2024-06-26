/**
 * @param {Request} request
 * @returns {Response}
 */
export function GET(request) {
  const url = new URL(request.url);

  const upstreamUrl = new URL(
    url.pathname.replace("/api/nadocast-proxy", "http://data.nadocast.com"),
  );

  return fetch(upstreamUrl.href);
}
