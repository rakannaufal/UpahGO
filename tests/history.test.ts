import test from "node:test";
import assert from "node:assert/strict";
import { DemoApi } from "../apps/mobile/src/demo.ts";
import type { Agreement, Contact } from "../shared/contracts.ts";

test("demo history pages stable ties; old detail and active grants bypass the first 100", async () => {
  const api = new DemoApi();
  const base = api.contacts[0]!;
  api.actor = base.senderId;
  const createdAt = "2026-01-01T01:00:00.000Z";
  const old: Contact = {
    ...base,
    id: "old-contact",
    createdAt: "2025-01-01T00:00:00.000Z",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    status: "accepted",
  };
  api.contacts = [
    old,
    ...Array.from({ length: 101 }, (_, i): Contact => ({
      ...old,
      id: `contact-${String(i).padStart(3, "0")}`,
      status: "declined",
      createdAt,
    })),
  ];
  const agreement: Agreement = {
    ...api.agreements[0]!,
    id: "old-agreement",
    contactId: old.id,
    employerId: base.senderId,
    workerId: base.receiverId,
    status: "agreed",
    createdAt: old.createdAt,
  };
  api.agreements = [
    agreement,
    ...Array.from({ length: 101 }, (_, i): Agreement => ({
      ...agreement,
      id: `agreement-${String(i).padStart(3, "0")}`,
      status: "completed",
      createdAt,
    })),
  ];
  api.notices = Array.from({ length: 102 }, (_, i) => ({
    id: `notice-${String(i).padStart(3, "0")}`,
    createdAt,
    title: "Synthetic history",
    body: "Test",
    route: `/contact/${old.id}`,
    read: false,
    recipient: api.actor,
  }));
  for (const operation of [
    "contacts",
    "agreements",
    "notifications",
  ] as const) {
    const first = await api.call(operation);
    assert.equal(first.length, 100);
    const next = await api.call(operation, {
      after: { id: first.at(-1)!.id, createdAt: first.at(-1)!.createdAt },
    });
    assert.equal(next.length, 2);
    assert.equal(new Set([...first, ...next].map((item) => item.id)).size, 102);
    await assert.rejects(
      api.call(operation, { after: { id: "missing-date" } }),
      /INVALID_INPUT/,
    );
  }
  assert.equal((await api.call("contact", { id: old.id })).id, old.id);
  assert.equal(
    (await api.call("agreement", { id: agreement.id })).id,
    agreement.id,
  );
  assert.deepEqual(
    (
      await api.call("contacts", {
        filter: "active",
        targetId: old.receiverId,
        targetRole: old.receiverRole,
      })
    ).map((item) => item.id),
    [old.id],
  );
  assert.deepEqual(
    (await api.call("agreements", { filter: "active" })).map((item) => item.id),
    [agreement.id],
  );
  api.contacts[0]!.expiresAt = "2020-01-01T00:00:00.000Z";
  assert.equal((await api.call("contacts", { filter: "active" })).length, 0);
  assert.equal((await api.call("contact", { id: old.id })).status, "expired");
  api.actor = api.profiles.find(
    (p) => ![old.senderId, old.receiverId].includes(p.id),
  )!.id;
  await assert.rejects(api.call("contact", { id: old.id }), /UNAVAILABLE/);
  await assert.rejects(
    api.call("agreement", { id: agreement.id }),
    /UNAVAILABLE/,
  );
});
