import { handlePhotoRequest } from "./handler.ts";
import * as magick from "@imagemagick/magick-wasm";
function assert(value: unknown, label: string): void {
  if (!value) throw new Error(label);
}
Deno.test(
  "photo edge: gateway, auth, consent, decoding, private pending commit, signed access and deletion",
  async () => {
    const user = "11111111-1111-4111-8111-111111111111";
    const secret = "synthetic-gateway-secret-for-local-edge-tests";
    const requestId = "77777777-7777-4777-8777-777777777777";
    const keys = {
      UPAHGO_GATEWAY_SECRET: secret,
      SUPABASE_URL: "https://synthetic.supabase.co",
      SUPABASE_ANON_KEY: "synthetic-public-key",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key-for-local-test",
      UPAHGO_TELEMETRY_ENABLED: "true",
      UPAHGO_ENVIRONMENT: "staging",
    };
    const oldEnv = new Map(
      Object.keys(keys).map((key) => [key, Deno.env.get(key)]),
    );
    for (const [key, value] of Object.entries(keys)) Deno.env.set(key, value);
    const originalFetch = globalThis.fetch;
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (line: string) => {
      logs.push(line);
    };
    let authFailure = false,
      authenticated = true,
      hasAccess = true,
      storedKey: string | null = null,
      committed = false,
      uploaded = 0,
      removed = 0,
      uploadFailsAt = 0,
      commitMode = "ok";
    const reservations = new Set<string>();
    globalThis.fetch = async (input, init) => {
      const req = new Request(input, init);
      const url = new URL(req.url);
      assert(url.origin === keys.SUPABASE_URL, "fixed upstream only");
      const json = (body: unknown, status = 200) =>
        Promise.resolve(
          new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json" },
          }),
        );
      assert(
        req.headers.get("x-upahgo-request-id") === requestId,
        "trusted ID reaches upstream",
      );
      if (url.pathname === "/auth/v1/user" && authFailure)
        return json({ message: "synthetic-private-auth-outage" }, 503);
      if (url.pathname === "/auth/v1/user")
        return json(
          authenticated
            ? {
                id: user,
                app_metadata: {},
                user_metadata: {},
                aud: "authenticated",
                created_at: new Date().toISOString(),
              }
            : { message: "invalid" },
          authenticated ? 200 : 401,
        );
      if (url.pathname === "/rest/v1/rpc/upahgo_action") {
        const body = await req.json();
        assert(
          req.headers.get("x-upahgo-gateway") === secret,
          "database gateway header",
        );
        if (body.p_operation === "bootstrap")
          return json({
            profile: { id: user },
            account: { role: "worker", status: "active" },
          });
        if (body.p_operation === "photo_access")
          return hasAccess
            ? json({ key: storedKey, status: "pending" })
            : json({ message: "UNAVAILABLE" }, 400);
      }
      if (url.pathname === "/rest/v1/rpc/upahgo_photo_replace") {
        assert(
          req.headers.get("Authorization") ===
            `Bearer ${keys.SUPABASE_SERVICE_ROLE_KEY}`,
          "service-only commit",
        );
        const body = await req.json();
        const previous = storedKey;
        assert(
          body.p_user === user && body.p_role === "worker",
          "trusted actor and role",
        );
        if (commitMode === "fail")
          return json({ message: "synthetic commit failed" }, 500);
        if (body.p_key)
          assert(
            reservations.has(body.p_key),
            "reservation exists before commit",
          );
        storedKey = body.p_key;
        committed = true;
        if (commitMode === "uncertain")
          return json({ message: "synthetic response lost after commit" }, 500);
        return json(previous);
      }
      if (url.pathname === "/rest/v1/rpc/upahgo_media_admin") {
        assert(
          req.headers.get("Authorization") ===
            `Bearer ${keys.SUPABASE_SERVICE_ROLE_KEY}`,
          "service-only reservation",
        );
        const body = await req.json();
        assert(
          body.p_action === "reserve" &&
            body.p_args.userId === user &&
            body.p_args.role === "worker",
          "trusted upload reservation",
        );
        const key = `${user}/worker/${crypto.randomUUID()}`;
        reservations.add(key);
        return json({ key });
      }
      if (
        url.pathname.startsWith("/storage/v1/object/profile-photos/") &&
        req.method === "POST"
      ) {
        const path = decodeURIComponent(
          url.pathname.slice("/storage/v1/object/profile-photos/".length),
        );
        assert(
          reservations.has(path.replace(/(-thumb)?\.jpg$/, "")),
          "reservation precedes Storage upload",
        );
        const bytes = new Uint8Array(await req.arrayBuffer());
        magick.ImageMagick.read(bytes, (image) => {
          assert(image.width <= 1280 && image.height <= 1280, "bounded output");
          assert(image.profileNames.length === 0, "EXIF removed");
        });
        uploaded++;
        if (uploaded === uploadFailsAt)
          return json({ message: "synthetic upload failure" }, 403);
        return json({ Key: url.pathname });
      }
      if (url.pathname.startsWith("/storage/v1/object/sign/profile-photos/"))
        return json({
          signedURL:
            url.pathname.replace("/storage/v1", "") + "?token=synthetic",
        });
      if (
        url.pathname === "/storage/v1/object/profile-photos" &&
        req.method === "DELETE"
      ) {
        removed++;
        return json([]);
      }
      throw new Error("Unexpected upstream: " + url.pathname);
    };
    const request = (
      method = "GET",
      consent = true,
      bytes?: Uint8Array,
      gateway = secret,
    ) =>
      new Request(`https://edge.example/profile-photo?id=${user}&role=worker`, {
        method,
        headers: {
          Authorization: "Bearer synthetic-user-token",
          "x-upahgo-gateway": gateway,
          "x-upahgo-request-id": requestId,
          "Content-Type": "image/jpeg",
          "x-upahgo-photo-consent": String(consent),
        },
        body: bytes ? new Uint8Array(bytes).buffer : undefined,
      });
    try {
      const rejectedGateway = await handlePhotoRequest(
        request("GET", true, undefined, "wrong"),
      );
      assert(
        rejectedGateway.status === 403 &&
          rejectedGateway.headers.get("X-Request-ID") !== requestId,
        "direct gateway bypass denied",
      );
      authenticated = false;
      assert(
        (await handlePhotoRequest(request())).status === 401,
        "invalid user denied",
      );
      authenticated = true;
      authFailure = true;
      assert(
        (await handlePhotoRequest(request())).status === 503,
        "Auth outage must not masquerade as invalid credentials",
      );
      authFailure = false;
      const fixture = await Deno.readFile(
        new URL("../../../tests/fixtures/synthetic-photo.jpg", import.meta.url),
      );
      assert(
        (await handlePhotoRequest(request("POST", false, fixture))).status ===
          400,
        "consent required",
      );
      assert(
        (
          await handlePhotoRequest(
            request("POST", true, new TextEncoder().encode("fake JPEG")),
          )
        ).status === 400,
        "fake JPEG denied",
      );
      assert(!committed && uploaded === 0, "invalid image never stored");
      uploadFailsAt = 2;
      assert(
        (await handlePhotoRequest(request("POST", true, fixture))).status ===
          503,
        "partial upload reports failure",
      );
      assert(
        reservations.size === 1 &&
          uploaded === 2 &&
          !committed &&
          removed === 0,
        "partial bytes have a durable reservation; no premature delete",
      );
      uploadFailsAt = 0;
      uploaded = 0;
      commitMode = "fail";
      assert(
        (await handlePhotoRequest(request("POST", true, fixture))).status ===
          503,
        "failed commit reports failure",
      );
      assert(
        reservations.size === 2 && storedKey === null && removed === 0,
        "failed commit leaves cleanup reservation",
      );
      commitMode = "uncertain";
      uploaded = 0;
      assert(
        (await handlePhotoRequest(request("POST", true, fixture))).status ===
          503,
        "uncertain commit reports retryable error",
      );
      assert(
        storedKey !== null && removed === 0,
        "uncertain active key is never compensated inline",
      );
      commitMode = "ok";
      uploaded = 0;
      const result = await handlePhotoRequest(request("POST", true, fixture));
      assert(result.status === 200, "valid upload succeeds");
      assert(
        (await result.json()).data.status === "pending",
        "no automatic publication",
      );
      assert(committed && uploaded === 2, "detail and thumbnail committed");
      assert(
        String(storedKey).startsWith(`${user}/worker/`),
        "safe server-generated key",
      );
      hasAccess = false;
      assert(
        (await handlePhotoRequest(request())).status === 400,
        "unauthorized target never signed",
      );
      hasAccess = true;
      const photo = await handlePhotoRequest(request());
      assert(
        (await photo.json()).data.uri.startsWith(keys.SUPABASE_URL),
        "authorized photo signed",
      );
      const deletion = await handlePhotoRequest(request("DELETE"));
      assert(
        deletion.status === 202 && removed === 0 && storedKey === null,
        "delete clears metadata and acknowledges queued physical cleanup",
      );
      assert(
        (await deletion.json()).data.cleanup === "queued",
        "queued cleanup response contract",
      );
      assert(
        deletion.headers.get("X-Request-ID") === requestId,
        "trusted gateway correlation returned",
      );
      const events = logs.map((line) => JSON.parse(line));
      assert(
        events.some(
          (event) =>
            event.kind === "dependency" &&
            event.dependency === "storage" &&
            event.status === 403,
        ),
        "Storage fault measured",
      );
      assert(
        events.filter((event) => event.kind === "request").length > 5,
        "terminal request events recorded",
      );
      assert(
        events.some(
          (event) =>
            event.requestId === requestId && event.dependency === "database",
        ),
        "database correlation",
      );
      for (const value of [
        user,
        secret,
        keys.SUPABASE_SERVICE_ROLE_KEY,
        "synthetic-user-token",
        "synthetic commit failed",
        "synthetic-private-auth-outage",
        "https://",
      ])
        assert(
          !logs.join("\n").includes(value),
          "no private data in telemetry",
        );
    } finally {
      globalThis.fetch = originalFetch;
      console.log = originalLog;
      for (const [key, value] of oldEnv) {
        if (value === undefined) Deno.env.delete(key);
        else Deno.env.set(key, value);
      }
    }
  },
);
