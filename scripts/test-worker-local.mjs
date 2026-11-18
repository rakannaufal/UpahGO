import assert from "node:assert/strict";
// Unknown operations are rejected before Auth; this test sends no remote requests.
const responses = await Promise.all(
  Array.from({ length: 190 }, () =>
    fetch("http://127.0.0.1:8787/v1/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer synthetic-local-rate-test-token",
      },
      body: JSON.stringify({ operation: "not-an-operation", args: {} }),
    }),
  ),
);
const counts = {};
for (const response of responses)
  counts[response.status] = (counts[response.status] ?? 0) + 1;
assert.ok(counts[429] >= 10, JSON.stringify(counts));
assert.equal(
  Object.keys(counts).some((status) => !["400", "429"].includes(status)),
  false,
);
console.log("Durable Object local concurrency:", counts);
