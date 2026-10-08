import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { openDb } from "../db.mjs";
import { createApp } from "../app.mjs";
import { createAssessor, validateAssessment } from "../assessment.mjs";
import { bank } from "../questions.mjs";
const origin = "http://localhost:5173";
const rawFor = (q, answer) => ({
  criteria: q.criteria.map((c) => ({
    id: c.id,
    rating: "met",
    evidence: answer,
    feedback: "Fixture feedback for transport tests only.",
  })),
  summary: "Test fixture, not a real model evaluation.",
  strengths: ["Example"],
  improvements: ["Keep practising"],
  misconceptions: [],
  confidence: "high",
});
async function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), "interprep-"));
  const db = openDb(join(dir, "test.sqlite"));
  let calls = 0;
  const app = createApp({
    db,
    apiKey: "test-key-not-real",
    assess: async (q, a) => {
      calls++;
      return {
        ...validateAssessment(rawFor(q, a), q, a),
        model: "test-fixture",
      };
    },
    ...options,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const client = () => {
    let cookie = "";
    return async (path, method = "GET", body, headers = {}) => {
      const res = await fetch(base + "/api" + path, {
        method,
        headers: {
          origin,
          "content-type": "application/json",
          cookie,
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.headers.get("set-cookie"))
        cookie = res.headers.get("set-cookie").split(";")[0];
      return {
        status: res.status,
        data: await res.json(),
        cookie: res.headers.get("set-cookie"),
      };
    };
  };
  return { db, client, calls: () => calls };
}
const register = (c) =>
  c("/auth/register", "POST", {
    email: `${crypto.randomUUID()}@example.com`,
    password: "Safe-test-password!",
    confirmPassword: "Safe-test-password!",
    name: "Example User",
  });
test("Accounts, ownership, persisted drafts, rubric privacy, scoring, invalidation and logout", async (t) => {
  const f = await fixture(t),
    a = f.client(),
    b = f.client();
  assert.equal((await a("/workspace")).status, 401);
  const reg = await register(a);
  assert.equal(reg.status, 201);
  assert.match(reg.cookie, /HttpOnly/);
  assert.match(reg.cookie, /SameSite=Strict/);
  await register(b);
  assert.equal(
    (
      await a("/auth/login", "POST", {
        email: "nobody@example.com",
        password: "Safe-test-password!",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await a(
        "/sessions",
        "POST",
        { topic: bank[0].topic },
        { origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  const made = await a("/sessions", "POST", { topic: bank[0].topic });
  assert.equal(made.status, 201);
  const s = made.data;
  assert.equal(s.questions.length, 5);
  assert.equal(s.questions[0].referenceAnswer, undefined);
  assert.equal(s.questions[0].criteria, undefined);
  assert.equal(
    (await b(`/sessions/${s.id}/answer`, "PUT", { index: 0, answer: "stolen" }))
      .status,
    404,
  );
  assert.equal((await a(`/sessions/${s.id}/complete`, "POST", {})).status, 409);
  assert.equal(
    (await a(`/sessions/${s.id}/answer`, "PUT", { index: 9, answer: "x" }))
      .status,
    400,
  );
  assert.equal(
    (
      await a(`/sessions/${s.id}/answer`, "PUT", {
        index: 0,
        answer: "x".repeat(12001),
      })
    ).status,
    400,
  );
  for (let i = 0; i < 5; i++) {
    assert.equal(
      (
        await a(`/sessions/${s.id}/answer`, "PUT", {
          index: i,
          answer: "An answer for the fixture.",
        })
      ).status,
      200,
    );
    const r = await a(`/sessions/${s.id}/assess`, "POST", { index: i });
    assert.equal(r.status, 200);
    assert.equal(r.data.score, 100);
  }
  assert.equal(f.calls(), 5);
  await a(`/sessions/${s.id}/assess`, "POST", { index: 0 });
  assert.equal(f.calls(), 5, "cached reviews should not bill twice");
  await a(`/sessions/${s.id}/answer`, "PUT", {
    index: 0,
    answer: "Changed answer.",
  });
  assert.equal((await a(`/sessions/${s.id}/complete`, "POST", {})).status, 409);
  await a(`/sessions/${s.id}/assess`, "POST", { index: 0 });
  assert.equal(
    (await a("/sessions/active")).data.answers[0],
    "Changed answer.",
  );
  const finished = await a(`/sessions/${s.id}/complete`, "POST", {});
  assert.equal(finished.data.score, 100);
  assert.equal((await a(`/sessions/${s.id}/complete`, "POST", {})).status, 200);
  assert.equal((await a("/workspace")).data.sessions.length, 1);
  assert.equal((await b("/workspace")).data.sessions.length, 0);
  assert.equal(
    (
      await a("/workspace", "PUT", {
        profile: { name: "Pratik", role: "Engineer" },
        interviews: [],
        tasks: [true, false, true],
        sessions: [],
      })
    ).status,
    400,
    "client cannot set scores or sessions",
  );
  const w = {
    profile: { name: "Pratik", role: "Engineer" },
    interviews: [],
    tasks: [true, false, true],
  };
  assert.equal((await a("/workspace", "PUT", w)).status, 200);
  assert.equal((await a("/workspace")).data.profile.name, "Pratik");
  assert.equal((await a("/auth/logout", "POST", {})).status, 200);
  assert.equal((await a("/workspace")).status, 401);
});
test("Missing key never invents scores; failed provider retains draft; quota is enforced", async (t) => {
  const f = await fixture(t, { apiKey: "" }),
    c = f.client();
  await register(c);
  const s = (await c("/sessions", "POST", { topic: bank[0].topic })).data;
  await c(`/sessions/${s.id}/answer`, "PUT", {
    index: 0,
    answer: "Saved answer",
  });
  assert.equal(
    (await c(`/sessions/${s.id}/assess`, "POST", { index: 0 })).status,
    503,
  );
  assert.equal((await c("/sessions/active")).data.answers[0], "Saved answer");
  assert.equal((await c("/workspace")).data.sessions.length, 0);
  const g = await fixture(t, {
      dailyLimit: 1,
      assess: async () => {
        throw Error("private provider secret");
      },
    }),
    d = g.client();
  await register(d);
  const s2 = (await d("/sessions", "POST", { topic: bank[0].topic })).data;
  await d(`/sessions/${s2.id}/answer`, "PUT", {
    index: 0,
    answer: "Saved answer",
  });
  const failed = await d(`/sessions/${s2.id}/assess`, "POST", { index: 0 });
  assert.equal(failed.status, 500);
  assert.ok(!failed.data.error.includes("secret"));
  assert.equal((await d("/sessions/active")).data.assessments[0], null);
  assert.equal(
    (await d(`/sessions/${s2.id}/assess`, "POST", { index: 0 })).status,
    429,
  );
});
test("SQLite survives closing and reopening; user passwords are not plaintext", () => {
  const dir = mkdtempSync(join(tmpdir(), "interprep-persist-"));
  try {
    const path = join(dir, "db.sqlite");
    let db = openDb(path);
    db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
      "u",
      "u@example.com",
      "salt:hash",
      "{}",
    );
    db.close();
    db = openDb(path);
    assert.equal(
      db.prepare("SELECT email FROM users WHERE id=?").get("u").email,
      "u@example.com",
    );
    assert.equal(db.prepare("SELECT count(*) AS n FROM questions").get().n, 15);
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("Evidence and criteria validation; scores calculated from trusted weights", () => {
  const q = bank[0],
    answer = "Maps use keys.";
  const raw = rawFor(q, answer);
  raw.criteria[0].rating = "partial";
  raw.criteria[1].rating = "incorrect";
  assert.equal(validateAssessment(raw, q, answer).score, 48);
  assert.throws(() =>
    validateAssessment(
      { ...raw, criteria: [raw.criteria[0], raw.criteria[0], raw.criteria[0]] },
      q,
      answer,
    ),
  );
  const bad = rawFor(q, answer);
  bad.criteria[0].evidence = "a fabricated quotation";
  assert.throws(() => validateAssessment(bad, q, answer));
  assert.throws(() => validateAssessment({ ...raw, score: 100 }, q, answer));
});
test("Responses API uses structured schema and private rubric; rejects malformed/refused results", async () => {
  const q = bank[0],
    answer = "Maps use keys.";
  let payload;
  const assessor = createAssessor({
    apiKey: "test-only",
    fetchImpl: async (url, opts) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      payload = JSON.parse(opts.body);
      return new Response(
        JSON.stringify({
          status: "completed",
          model: "test",
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify(rawFor(q, answer)),
                },
              ],
            },
          ],
        }),
        { status: 200 },
      );
    },
  });
  assert.equal((await assessor(q, answer)).score, 100);
  assert.equal(payload.store, false);
  assert.equal(payload.text.format.strict, true);
  assert.match(payload.instructions, /untrusted/);
  assert.ok(payload.instructions.includes(q.referenceAnswer));
  for (const body of [
    { status: "incomplete" },
    { status: "completed", output: [{ content: [{ type: "refusal" }] }] },
    {
      status: "completed",
      output: [{ content: [{ type: "output_text", text: "bad json" }] }],
    },
  ]) {
    const a = createAssessor({
      apiKey: "test-only",
      fetchImpl: async () => new Response(JSON.stringify(body)),
    });
    await assert.rejects(a(q, answer), (e) => e.status === 502);
  }
});
test("Concurrent reviews cannot double-bill or race draft edits; sign-in restores the account", async (t) => {
  let release, started;
  const entered = new Promise((r) => (started = r));
  const held = new Promise((r) => (release = r));
  const f = await fixture(t, {
    assess: async (q, a) => {
      started();
      await held;
      return {
        ...validateAssessment(rawFor(q, a), q, a),
        model: "test-fixture",
      };
    },
  });
  const c = f.client();
  const credentials = {
    email: "persist@example.com",
    password: "Safe-test-password!",
  };
  assert.equal(
    (
      await c("/auth/register", "POST", {
        ...credentials,
        name: "Example User",
        confirmPassword: credentials.password,
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await c("/auth/register", "POST", {
        ...credentials,
        name: "Example User",
        confirmPassword: credentials.password,
      })
    ).status,
    409,
  );
  const stored = f.db
    .prepare("SELECT password FROM users WHERE email=?")
    .get(credentials.email).password;
  assert.notEqual(stored, credentials.password);
  assert.match(stored, /^[a-f0-9]+:[a-f0-9]+$/);
  const s = (await c("/sessions", "POST", { topic: bank[0].topic })).data;
  await c(`/sessions/${s.id}/answer`, "PUT", {
    index: 0,
    answer: "Saved answer",
  });
  const pending = c(`/sessions/${s.id}/assess`, "POST", { index: 0 });
  await entered;
  assert.equal(
    (await c(`/sessions/${s.id}/assess`, "POST", { index: 0 })).status,
    409,
  );
  assert.equal(
    (await c(`/sessions/${s.id}/answer`, "PUT", { index: 0, answer: "Race" }))
      .status,
    409,
  );
  assert.equal((await c(`/sessions/${s.id}`, "DELETE", {})).status, 409);
  release();
  assert.equal((await pending).status, 200);
  await c("/auth/logout", "POST", {});
  assert.equal((await c("/auth/login", "POST", credentials)).status, 200);
  assert.equal((await c("/sessions/active")).data.answers[0], "Saved answer");
  await c("/workspace/reset", "POST", {});
  assert.equal((await c("/sessions/active")).data, null);
});

test("Registration policy checks all common passwords and required conditions", async () => {
  const { COMMON_PASSWORDS, passwordError, registrationPasswordError } =
    await import("../../shared/password-policy.mjs");
  for (const p of COMMON_PASSWORDS) {
    assert.equal(passwordError(p, "Example User"), "Password is too common");
    assert.equal(
      passwordError(p.toUpperCase(), "Example User"),
      "Password is too common",
    );
  }
  assert.match(passwordError("Ab!12", "Example User"), /7 characters/);
  assert.match(passwordError("abcdef!", "Example User"), /capital/);
  assert.match(passwordError("Abcdefg", "Example User"), /special symbol/);
  assert.match(passwordError("Abcdef ", "Example User"), /special symbol/);
  assert.match(passwordError("PRATIK!7", "Pratik Deuchand"), /your name/);
  assert.match(passwordError("P-r-a-t-i-k!7", "Pratik Deuchand"), /your name/);
  assert.match(passwordError("Deuchand!7", "Pratik Deuchand"), /your name/);
  assert.match(passwordError("Élodie!7", "Élodie Martin"), /your name/);
  assert.equal(passwordError("Zebra!7", "Example User"), "");
  assert.equal(
    registrationPasswordError("Zebra!7", "Zebra!8", "Example User"),
    "Passwords do not match.",
  );
  assert.equal(
    registrationPasswordError("Zebra!7", "Zebra!7", "Example User"),
    "",
  );
});

test("API enforces registration rules, saves name, and accepts seven-character passwords", async (t) => {
  const f = await fixture(t),
    c = f.client();
  const base = {
    email: "policy@example.com",
    name: "Pratik Deuchand",
    password: "Zebra!7",
    confirmPassword: "Zebra!7",
  };
  for (const [password, expected] of [
    ["Password1", "Password is too common"],
    ["Pratik!7", "Password must not include your name."],
    ["abcdef!", "Password must include a capital letter."],
    ["Abcdefg", "Password must include a special symbol."],
    ["Ab!123", "Password must have at least 7 characters."],
  ]) {
    const r = await c("/auth/register", "POST", {
      ...base,
      password,
      confirmPassword: password,
    });
    assert.equal(r.status, 400);
    assert.equal(r.data.error, expected);
  }
  assert.equal(
    (await c("/auth/register", "POST", { ...base, confirmPassword: "wrong" }))
      .data.error,
    "Passwords do not match.",
  );
  const { confirmPassword, ...missingConfirmation } = base;
  assert.equal(
    (await c("/auth/register", "POST", missingConfirmation)).status,
    400,
  );
  assert.equal((await c("/auth/register", "POST", base)).status, 201);
  assert.equal((await c("/workspace")).data.profile.name, base.name);
  const row = f.db.prepare("SELECT * FROM users WHERE email=?").get(base.email);
  assert.ok(!JSON.stringify(row).includes(base.password));
  await c("/auth/logout", "POST", {});
  assert.equal(
    (
      await c("/auth/login", "POST", {
        email: base.email,
        password: base.password,
      })
    ).status,
    200,
  );
});

test("Previously registered passwords still work without confirmation or new-policy checks", async (t) => {
  const { scryptSync } = await import("node:crypto");
  const f = await fixture(t),
    c = f.client(),
    salt = "legacy-test-salt",
    password = "legacy-password";
  f.db
    .prepare("INSERT INTO users VALUES(?,?,?,?)")
    .run(
      "legacy",
      "legacy@example.com",
      salt + ":" + scryptSync(password, salt, 64).toString("hex"),
      JSON.stringify({
        profile: { name: "Legacy", role: "" },
        tasks: [false, false, false],
        interviews: [],
      }),
    );
  assert.equal(
    (await c("/auth/login", "POST", { email: "legacy@example.com", password }))
      .status,
    200,
  );
});
