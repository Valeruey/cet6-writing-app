// Minimal test endpoint — no imports
export default async function handler(req: Request) {
  return new Response(JSON.stringify({ ok: true, url: req.url }), {
    headers: { "Content-Type": "application/json" },
  });
}
