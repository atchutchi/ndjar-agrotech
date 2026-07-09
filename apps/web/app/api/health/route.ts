export function GET(): Response {
  return Response.json({
    service: "@ndjar/web",
    status: "ok",
  });
}
