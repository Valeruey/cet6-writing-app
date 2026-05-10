export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  return new Response(JSON.stringify({ ok: true, runtime: "edge" }), {
    headers: { "Content-Type": "application/json" },
  });
}
