// @ts-nocheck
import app from "../server/index";

export default async function handler(req: any, res: any) {
  try {
    const host = req.headers.host || "localhost";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const url = `${proto}://${host}${req.url}`;

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (v !== undefined) headers.set(k, String(v));
    }

    let body: BodyInit | null = null;
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const webReq = new Request(url, { method: req.method, headers, body: body as BodyInit | undefined });
    const webRes = await app.fetch(webReq);

    res.status(webRes.status);
    webRes.headers.forEach((v: string, k: string) => {
      if (!["content-encoding", "transfer-encoding"].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });

    const ct = webRes.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      res.json(await webRes.json());
    } else {
      res.send(await webRes.text());
    }
  } catch (e: any) {
    console.error("API error:", e.message, e.stack);
    res.status(500).json({ error: "Internal server error", detail: e.message });
  }
}
