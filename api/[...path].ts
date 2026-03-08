import { handle } from "@hono/node-server/vercel";
import app from "../jiosaavn-api/dist/server.js";

export default handle(app);
