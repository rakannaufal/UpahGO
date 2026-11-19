import assert from "node:assert/strict";
import { chmod, readFile, stat, writeFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";

// Explicit opt-in: this creates synthetic Auth fixtures and business records.
const target = "aqzlgrahfxmbvtfwebsx";
assert.equal(
  process.env.UPAHGO_STAGING_WRITE_ACK,
  target,
  "Explicit staging write acknowledgement required",
);
const credentialsPath = process.env.UPAHGO_STAGING_CREDENTIALS;
assert.ok(credentialsPath, "Private credentials path required");
assert.equal(
  (await stat(credentialsPath)).mode & 0o077,
  0,
  "Credentials must be private",
);
const config = JSON.parse(await readFile(credentialsPath, "utf8"));
assert.equal(config.ref, target);
assert.equal(config.supabaseUrl, `https://${target}.supabase.co`);
assert.equal(
  config.workerUrl,
  "https://upahgo-api-staging.upahgo-dev-rakan.workers.dev",
);
const phase = process.argv[2] ?? "core";
assert.ok(["core", "media", "security"].includes(phase));
const resume = process.argv.includes("--resume");
if (phase === "core" && !resume) {
  assert.ok(
    !config.contactId && !config.agreementId,
    "Existing scenario must be preserved; use fresh isolated fixtures for another core run",
  );
}
const evidence = {
  startedAt: new Date().toISOString(),
  target,
  workerUrl: config.workerUrl,
  phase,
  synthetic: true,
  phoneVerification: "Admin fixture; no OTP/SMS sent or tested",
  checks: [],
};
if (resume) {
  assert.ok(
    phase === "core" && config.contactId && !config.agreementId,
    "Resume only after the recorded contact checkpoint",
  );
  const previous = JSON.parse(
    await readFile(
      new URL(
        "../audits/2026-11-18-production/remediation/qa-001/staging/live/core-initial.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(previous.target, target);
  evidence.checks = previous.checks;
  evidence.resumedFrom =
    "core-initial.json; incorrect expected error corrected against SQL contract";
}
const tokens = {};
const save = async () => {
  await writeFile(credentialsPath, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
  await chmod(credentialsPath, 0o600);
};
function check(condition, label) {
  assert.ok(condition, label);
  evidence.checks.push({ label, passed: true });
  console.log("PASS " + label);
}
async function http(
  base,
  path,
  { actor, admin, body, method, headers = {} } = {},
) {
  const response = await fetch(base + path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: {
      ...(base === config.supabaseUrl
        ? { apikey: admin ? config.serviceRoleKey : config.anonKey }
        : {}),
      ...(actor
        ? { Authorization: `Bearer ${tokens[actor]}` }
        : admin
          ? { Authorization: `Bearer ${config.serviceRoleKey}` }
          : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body:
      body instanceof Uint8Array
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
    redirect: "error",
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { status: response.status, data, headers: response.headers };
}
async function action(actor, operation, args = {}, error) {
  const result = await http(config.workerUrl, "/v1/action", {
    actor,
    body: { operation, args },
  });
  if (error) {
    check(
      result.status >= 400 && result.data?.error === error,
      `${actor} ${operation} denied ${error}; HTTP${result.status}`,
    );
    return result.data;
  }
  assert.ok(
    result.status === 200 && result.data && !result.data.error,
    `${actor} ${operation}: HTTP${result.status} ${result.data?.error ?? "invalid response"}`,
  );
  assert.ok(result.headers.get("x-request-id"), "Gateway request ID required");
  return result.data.data;
}

try {
  config.fixtures ??= {};
  const names = ["employer", "worker", "outsider"];
  for (const [index, actor] of names.entries()) {
    let fixture = config.fixtures[actor];
    if (!fixture) {
      assert.equal(phase, "core", "Create fixtures with core phase first");
      fixture = {
        email: `qa001-${actor}-${randomUUID()}@example.invalid`,
        password: randomBytes(32).toString("base64url"),
      };
      const created = await http(config.supabaseUrl, "/auth/v1/admin/users", {
        admin: true,
        body: {
          email: fixture.email,
          password: fixture.password,
          email_confirm: true,
          phone: `1202555010${index}`,
          phone_confirm: true,
          app_metadata: { qa_fixture: "qa001-staging" },
        },
      });
      assert.ok(
        [200, 201].includes(created.status) && created.data?.id,
        `Synthetic ${actor} provisioning HTTP${created.status}`,
      );
      fixture.id = created.data.id;
      config.fixtures[actor] = fixture;
      await save();
    }
    const login = await http(
      config.supabaseUrl,
      "/auth/v1/token?grant_type=password",
      { body: { email: fixture.email, password: fixture.password } },
    );
    assert.ok(
      login.status === 200 &&
        login.data?.user?.id === fixture.id &&
        login.data.access_token,
      `Real Auth password session for ${actor}; HTTP${login.status}`,
    );
    tokens[actor] = login.data.access_token;
  }
  check(true, "Three synthetic accounts signed in through real Supabase Auth");
  const worker = config.fixtures.worker.id;
  if (phase === "core") {
    if (!resume) {
      const noAuth = await http(config.workerUrl, "/v1/action", {
        body: { operation: "bootstrap", args: {} },
      });
      check(
        noAuth.status === 401 && noAuth.data?.error === "UNAUTHENTICATED",
        "Gateway missing JWT denied",
      );
      const badJwt = await http(config.workerUrl, "/v1/action", {
        body: { operation: "bootstrap", args: {} },
        headers: { Authorization: "Bearer " + "invalid".repeat(8) },
      });
      check(
        badJwt.status === 401 && badJwt.data?.error === "UNAUTHENTICATED",
        "Malformed JWT denied through Auth",
      );
      const direct = await http(
        config.supabaseUrl,
        "/rest/v1/rpc/upahgo_action",
        { actor: "employer", body: { p_operation: "bootstrap", p_args: {} } },
      );
      check(
        direct.status >= 400 &&
          direct.data?.message === "GATEWAY_NOT_CONFIGURED",
        "Authenticated direct RPC denied without gateway",
      );
      const privateSchema = await http(
        config.supabaseUrl,
        "/rest/v1/accounts?select=id",
        { actor: "employer", headers: { "Accept-Profile": "upahgo_private" } },
      );
      check(
        privateSchema.status === 406 && privateSchema.data?.code === "PGRST106",
        "Private schema unavailable to PostgREST",
      );
      for (const actor of names) {
        const role = actor === "employer" ? "employer" : "worker";
        await action(actor, "bootstrap");
        await action(actor, "set_role", { role });
        await action(actor, "set_location", {
          latitude: 0.507,
          longitude: 101.447,
          accuracyMeters: 20,
          capturedAt: new Date().toISOString(),
          radiusKm: 5,
        });
        const profile = await action(actor, "save_profile", {
          name: `Akun sintetis QA ${actor}`,
          region: "Kota Pekanbaru",
          areaId: config.areaId,
          role,
          tags: ["sweep"],
          bio: "Fixture pengujian staging. Bukan penyedia jasa nyata.",
          priceAmount: 135000,
          priceNegotiable: actor === "worker",
        });
        check(
          profile.priceAmount === 135000 &&
            profile.priceNegotiable === (actor === "worker"),
          `${actor} profile price and negotiation persisted`,
        );
        await action(actor, "visibility", { enabled: true });
      }
      const discover = await action("employer", "discover", { role: "worker" });
      check(
        Array.isArray(discover) && discover.some((p) => p.id === worker),
        "Discovery returns visible synthetic worker",
      );
      const profile = await action("employer", "profile", {
        id: worker,
        role: "worker",
      });
      check(
        profile.priceAmount === 135000 && profile.priceNegotiable === true,
        "Profile detail agrees with listed price",
      );
      const request = { targetId: worker, targetRole: "worker", consent: true };
      await action(
        "employer",
        "request_contact",
        { ...request, consent: false },
        "CONSENT_REQUIRED",
      );
      const requests = await Promise.all([
        action("employer", "request_contact", request),
        action("employer", "request_contact", request),
      ]);
      check(
        requests[0].id === requests[1].id && requests[0].status === "pending",
        "Concurrent contact creation yields one pending contact",
      );
      config.contactId = requests[0].id;
      await save();
      const contact = { id: config.contactId };
      await action("outsider", "contact", contact, "UNAVAILABLE");
      await action(
        "employer",
        "respond_contact",
        { ...contact, action: "accept", consent: true },
        "FORBIDDEN",
      );
      await action(
        "worker",
        "respond_contact",
        { ...contact, action: "accept", consent: false },
        "CONSENT_REQUIRED",
      );
      const accepted = await action("worker", "respond_contact", {
        ...contact,
        action: "accept",
        consent: true,
      });
      check(
        accepted.status === "accepted",
        "Receiver explicitly accepts bilateral contact consent",
      );
      const phone = await action("employer", "approved_contact", contact);
      check(
        typeof phone.phone === "string" && phone.phone.length > 7,
        "Phone shared only after bilateral consent; value omitted",
      );
    }
    await action(
      "outsider",
      "approved_contact",
      { id: config.contactId },
      "UNAVAILABLE",
    );
    const agreement = await action("employer", "create_agreement", {
      contactId: config.contactId,
      title: "Pekerjaan sintetis QA",
      tasks: "Skenario uji menyapu area sintetis tanpa pekerjaan nyata.",
      wage: 150000,
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      timezone: "Asia/Jakarta",
    });
    config.agreementId = agreement.id;
    await save();
    const id = { id: agreement.id };
    check(
      agreement.wage === 150000 && agreement.status === "proposed",
      "Negotiated agreement wage persisted independently",
    );
    await action("outsider", "agreement", id, "UNAVAILABLE");
    await action(
      "outsider",
      "agreement_action",
      { ...id, action: "accept" },
      "UNAVAILABLE",
    );
    await action("worker", "agreement_action", { ...id, action: "accept" });
    await action("worker", "agreement_action", {
      ...id,
      action: "request_completion",
    });
    const completed = await action("employer", "agreement_action", {
      ...id,
      action: "confirm_completion",
    });
    check(
      completed.status === "completed" && completed.paymentReceivedAt === null,
      "Completion does not imply cash receipt",
    );
    await action(
      "employer",
      "agreement_action",
      { ...id, action: "acknowledge_payment" },
      "STATE_CONFLICT",
    );
    const acks = await Promise.all([
      action("worker", "agreement_action", {
        ...id,
        action: "acknowledge_payment",
      }),
      action("worker", "agreement_action", {
        ...id,
        action: "acknowledge_payment",
      }),
    ]);
    check(
      acks[0].paymentReceivedAt &&
        acks[0].paymentReceivedAt === acks[1].paymentReceivedAt,
      "Worker cash acknowledgement is concurrent-idempotent",
    );
    await action(
      "outsider",
      "submit_review",
      { ...id, score: 5, comment: "Ulasan sintetis QA." },
      "UNAVAILABLE",
    );
    await action("employer", "submit_review", {
      ...id,
      score: 5,
      comment: "Ulasan sintetis QA.",
    });
    await action(
      "employer",
      "submit_review",
      { ...id, score: 5, comment: "Ulasan sintetis QA." },
      "REVIEW_EXISTS",
    );
    const notifications = await action("worker", "notifications");
    check(
      notifications.length > 0,
      "Participant receives persisted notifications",
    );
    await action(
      "outsider",
      "read_notification",
      { id: notifications[0].id },
      "UNAVAILABLE",
    );
    await action("worker", "read_notification", { id: notifications[0].id });
    const report = await action("employer", "report", {
      targetId: worker,
      category: "other",
      detail: "Laporan sintetis QA. Tidak membutuhkan tindak lanjut pengguna.",
    });
    check(
      Boolean(report.id),
      "Synthetic report accepted; operator delivery unverified",
    );
  } else if (phase === "media") {
    const fixturePath = process.env.UPAHGO_STAGING_JPEG;
    assert.ok(fixturePath, "Synthetic JPEG path required");
    const jpeg = new Uint8Array(await readFile(fixturePath));
    const upload = await http(config.workerUrl, "/v1/photo", {
      actor: "worker",
      method: "POST",
      body: jpeg,
      headers: {
        "Content-Type": "image/jpeg",
        "x-upahgo-photo-consent": "true",
      },
    });
    check(
      upload.status === 200 && upload.data?.data?.status === "pending",
      `Real Edge JPEG processing and private Storage upload HTTP${upload.status} ${upload.data?.error ?? ""}`,
    );
    const own = await http(
      config.workerUrl,
      `/v1/photo?id=${worker}&role=worker&size=detail`,
      { actor: "worker" },
    );
    check(
      own.status === 200 &&
        own.data?.data?.status === "pending" &&
        typeof own.data.data.uri === "string",
      "Owner can obtain pending photo signed URL",
    );
    const signed = own.data.data.uri;
    const bytes = await fetch(signed, {
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    check(
      bytes.status === 200 &&
        bytes.headers.get("content-type")?.startsWith("image/jpeg"),
      "Owner signed URL serves processed JPEG",
    );
    await bytes.arrayBuffer();
    const other = await http(
      config.workerUrl,
      `/v1/photo?id=${worker}&role=worker`,
      { actor: "employer" },
    );
    check(
      other.status === 200 && other.data?.data?.uri === null,
      "Pending photo bytes hidden from another user",
    );
    const objectPath = new URL(signed).pathname.replace(
      "/object/sign/",
      "/object/authenticated/",
    );
    const direct = await http(config.supabaseUrl, objectPath, {
      actor: "employer",
    });
    check(direct.status >= 400, "Direct authenticated Storage read denied");
    const removed = await http(config.workerUrl, "/v1/photo", {
      actor: "worker",
      method: "DELETE",
    });
    check(
      removed.status === 202 &&
        removed.data?.data?.cleanup === "queued" &&
        removed.data.data.status === null,
      "Photo deletion returns queued202; not a byte-erasure claim",
    );
    const after = await http(
      config.workerUrl,
      `/v1/photo?id=${worker}&role=worker`,
      { actor: "worker" },
    );
    check(
      after.status === 200 && after.data?.data?.uri === null,
      "Deleted photo immediately loses current access grant",
    );
    await action("employer", "block", { targetId: worker });
    await action(
      "employer",
      "approved_contact",
      { id: config.contactId },
      "UNAVAILABLE",
    );
    const discover = await action("employer", "discover", { role: "worker" });
    check(
      !discover.some((p) => p.id === worker),
      "Block removes worker from discovery",
    );
    const history = await action("employer", "agreement", {
      id: config.agreementId,
    });
    check(
      history.status === "completed",
      "Agreement evidence remains readable after block",
    );
    await action(
      "outsider",
      "request_deletion",
      { confirm: false },
      "CONSENT_REQUIRED",
    );
    await action("outsider", "request_deletion", { confirm: true });
    const restricted = await action("outsider", "bootstrap");
    check(
      restricted.account.status === "deletion_requested",
      "Deletion immediately restricts synthetic account; finalizer disabled",
    );
    await action(
      "outsider",
      "visibility",
      { enabled: true },
      "ACCOUNT_RESTRICTED",
    );
  } else {
    const bareEdge = await http(
      config.supabaseUrl,
      "/functions/v1/profile-photo",
    );
    check(bareEdge.status === 401, "Edge platform rejects missing JWT");
    const bypass = await http(
      config.supabaseUrl,
      "/functions/v1/profile-photo",
      { actor: "worker" },
    );
    check(
      bypass.status === 403 && bypass.data?.error === "FORBIDDEN",
      "Valid user JWT cannot bypass gateway at Edge",
    );
    const helper = await http(
      config.supabaseUrl,
      "/rest/v1/rpc/upahgo_photo_replace",
      {
        actor: "worker",
        body: { p_user: worker, p_role: "worker", p_key: null },
      },
    );
    check(
      helper.status === 403 && helper.data?.code === "42501",
      "Authenticated user cannot execute service-only photo helper",
    );
    const badOrigin = await http(config.workerUrl, "/v1/action", {
      actor: "worker",
      body: { operation: "bootstrap", args: {} },
      headers: { Origin: "https://untrusted.invalid" },
    });
    check(
      badOrigin.status === 403 && badOrigin.data?.error === "FORBIDDEN",
      "Unlisted browser origin rejected",
    );
    const large = await http(config.workerUrl, "/v1/action", {
      actor: "worker",
      body: { operation: "bootstrap", args: { padding: "x".repeat(17000) } },
    });
    check(
      large.status === 413 && large.data?.error === "BODY_TOO_LARGE",
      "Oversized JSON rejected before upstream business operation",
    );
    const changedToken = tokens.worker.slice(0, -4) + "AAAA";
    const forged = await http(config.workerUrl, "/v1/action", {
      body: { operation: "bootstrap", args: {} },
      headers: { Authorization: `Bearer ${changedToken}` },
    });
    check(
      forged.status === 401 && forged.data?.error === "UNAUTHENTICATED",
      "JWT with altered signature rejected",
    );
    const jpeg = new Uint8Array(
      await readFile(process.env.UPAHGO_STAGING_JPEG),
    );
    const upload = await http(config.workerUrl, "/v1/photo", {
      actor: "worker",
      method: "POST",
      body: jpeg,
      headers: {
        "Content-Type": "image/jpeg",
        "x-upahgo-photo-consent": "true",
      },
    });
    check(
      upload.status === 200 && upload.data?.data?.status === "pending",
      "Expiry fixture uploaded through real decoder",
    );
    const own = await http(
      config.workerUrl,
      `/v1/photo?id=${worker}&role=worker`,
      { actor: "worker" },
    );
    assert.ok(
      own.status === 200 && own.data?.data?.uri,
      "Owner signed URL required for expiry check",
    );
    const signed = own.data.data.uri;
    const publicPath = new URL(signed).pathname.replace(
      "/object/sign/",
      "/object/public/",
    );
    const publicRead = await http(config.supabaseUrl, publicPath);
    check(
      publicRead.status >= 400,
      "Unsigned anonymous public Storage path cannot read private bytes",
    );
    const removed = await http(config.workerUrl, "/v1/photo", {
      actor: "worker",
      method: "DELETE",
    });
    check(
      removed.status === 202 && removed.data?.data?.cleanup === "queued",
      "Expiry fixture queued for cleanup",
    );
    // Signed links are bearer grants until their short expiry; never persist them in evidence.
    await new Promise((resolve) => setTimeout(resolve, 70000));
    const expired = await fetch(signed, {
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    await expired.arrayBuffer();
    check(
      [400, 401, 403].includes(expired.status),
      "Signed photo URL denied after its 60-second expiry",
    );
  }
  evidence.result = "passed";
} catch (error) {
  evidence.result = "failed";
  // Assertion messages contain only curated labels, HTTP statuses and allowlisted errors.
  evidence.failure =
    error instanceof Error ? error.message : "Unexpected failure";
  console.error(evidence.failure);
  process.exitCode = 1;
} finally {
  evidence.finishedAt = new Date().toISOString();
  await writeFile(
    new URL(
      `../audits/2026-11-18-production/remediation/qa-001/staging/live/${phase}.json`,
      import.meta.url,
    ),
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(
    `${phase}: ${evidence.result}; ${evidence.checks.length} assertions passed`,
  );
}
