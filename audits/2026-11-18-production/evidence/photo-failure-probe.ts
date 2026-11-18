import { handlePhotoRequest } from "../../../supabase/functions/profile-photo/handler.ts";

const user = "11111111-1111-4111-8111-111111111111";
const secret = "synthetic-audit-gateway-secret-at-least-32-characters";
const env = {
  UPAHGO_GATEWAY_SECRET: secret,
  SUPABASE_URL: "https://synthetic.supabase.co",
  SUPABASE_ANON_KEY: "synthetic-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key-for-local-test",
};

Deno.test("audit: failed object deletion and partial upload remain unreconciled", async () => {
  const originalFetch = globalThis.fetch;
  const previousEnv = new Map(Object.keys(env).map(key => [key, Deno.env.get(key)]));
  for (const [key, value] of Object.entries(env)) Deno.env.set(key, value);
  let mode = "delete";
  let uploads = 0;
  let removals = 0;
  let commits = 0;
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    if (url.origin !== env.SUPABASE_URL) throw new Error("External requests prohibited");
    if (url.pathname === "/auth/v1/user") return json({ id: user, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
    if (url.pathname === "/rest/v1/rpc/upahgo_action") return json({ profile: { id: user }, account: { role: "worker", status: "active" } });
    if (url.pathname === "/rest/v1/rpc/upahgo_photo_replace") {
      commits++;
      return json(`${user}/worker/old-object`);
    }
    if (url.pathname === "/storage/v1/object/profile-photos" && req.method === "DELETE") {
      removals++;
      return json({ statusCode: "403", error: "Forbidden", message: "synthetic storage removal failure" }, 403);
    }
    if (url.pathname.startsWith("/storage/v1/object/profile-photos/") && req.method === "POST") {
      uploads++;
      return uploads === 1 ? json({ Key: url.pathname }) : json({ statusCode: "403", error: "Forbidden", message: "synthetic thumbnail failure" }, 403);
    }
    throw new Error("Unexpected mock path: " + url.pathname);
  };
  try {
    const request = (method: string, body?: Uint8Array) => new Request("https://edge.example/profile-photo", {
      method, headers: { Authorization: "Bearer synthetic-user-token", "x-upahgo-gateway": secret, "Content-Type": "image/jpeg", "x-upahgo-photo-consent": "true" },
      body: body ? new Uint8Array(body).buffer : undefined,
    });
    const deletion = await handlePhotoRequest(request("DELETE"));
    const deletionBody = await deletion.json();
    if (deletion.status !== 200 || removals !== 1 || commits !== 1) throw new Error("Deletion failure case not reproduced");
    const deletionResult = { httpStatus: deletion.status, body: deletionBody, failedStorageRemovalCalls: removals, metadataDeletionCommits: commits };
    mode = "upload";
    uploads = 0; removals = 0; commits = 0;
    const fixture = await Deno.readFile(new URL("../../../tests/fixtures/synthetic-photo.jpg", import.meta.url));
    const upload = await handlePhotoRequest(request("POST", fixture));
    const uploadBody = await upload.json();
    if (upload.status !== 400 || uploads !== 2 || removals !== 0 || commits !== 0) throw new Error("Partial upload case not reproduced: " + mode);
    console.log(JSON.stringify({ deletion: deletionResult, partialUpload: { httpStatus: upload.status, body: uploadBody, successfulDetailObjects: 1, failedThumbnailObjects: 1, compensationCalls: removals, metadataCommits: commits }, limitation: "All upstream requests mocked; real handler and JPEG decoder used. No remote storage touched." }));
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of previousEnv) value === undefined ? Deno.env.delete(key) : Deno.env.set(key, value);
  }
});
