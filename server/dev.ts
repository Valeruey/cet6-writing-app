import { serveStatic } from "hono/bun";
import app from "./index";

// Serve built frontend in local dev
app.use(
  "/*",
  serveStatic({
    root: "./dist",
    rewriteRequestPath: (p) => (p === "/" ? "/index.html" : p),
  })
);

const port = parseInt(process.env.PORT || "3001");
console.log(`Server running at http://localhost:${port}`);

export default { port, fetch: app.fetch };
