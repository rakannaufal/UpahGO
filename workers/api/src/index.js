import { DurableObject } from "cloudflare:workers";
import { handleRequest } from "./handler.mjs";
export class RateLimiter extends DurableObject {
  async fetch(request) {
    const { limit } = await request.json();
    if (!Number.isInteger(limit) || limit < 1 || limit > 180)
      return new Response(null, { status: 400 });
    const window = Math.floor(Date.now() / 60000);
    const count = await this.ctx.storage.transaction(async (txn) => {
      const previous = await txn.get("bucket");
      const next = previous?.window === window ? previous.count + 1 : 1;
      await txn.put("bucket", { window, count: next });
      await txn.setAlarm(Date.now() + 120000);
      return next;
    });
    return new Response(null, { status: count > limit ? 429 : 200 });
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}
export default { fetch: (request, env) => handleRequest(request, env) };
