import { handle } from "hono/vercel";
import { createApp } from "../server/app";

const app = createApp();

export default handle(app);
