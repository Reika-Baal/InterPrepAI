import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  randomBytes,
  randomUUID,
  randomInt,
  scrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { ApiError, createAssessor } from "./assessment.mjs";
import { emptyWorkspace } from "./db.mjs";
import { registrationPasswordError } from "../shared/password-policy.mjs";
const derive = promisify(scrypt);
const hashToken = (t) => createHash("sha256").update(t).digest("hex");
const credentials = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(1).max(128),
    accessCode: z.string().max(200).optional(),
  })
  .strict();
const registrationCredentials = credentials.extend({
  name: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .refine((value) => /\p{L}/u.test(value)),
  confirmPassword: z.string().max(128),
});
const interview = z
  .object({
    id: z.string().min(1).max(100),
    company: z.string().max(160),
    role: z.string().max(160),
    date: z.string().max(20),
    time: z.string().max(20),
    location: z.string().max(300),
    type: z.enum(["Technical", "Behavioural", "Mixed"]),
    notes: z.string().max(10000),
    status: z.enum(["Upcoming", "Completed"]),
  })
  .strict();
const workspaceSchema = z
  .object({
    profile: z
      .object({
        name: z.string().trim().min(1).max(60),
        role: z.string().max(100),
      })
      .strict(),
    interviews: z.array(interview).max(300),
    tasks: z.array(z.boolean()).length(3),
  })
  .strict();
const publicQuestion = ({ id, prompt, topic, kind, version }) => ({
  id,
  prompt,
  topic,
  kind,
  version,
});
const publicSession = (s) => ({
  ...s,
  questions: s.questions.map(publicQuestion),
});
export function createApp({
  db,
  apiKey = "",
  model = "gpt-4.1-mini",
  origin = "http://localhost:5173",
  production = false,
  registrationCode = "",
  dailyLimit = 200,
  userDailyLimit = 30,
  assess = createAssessor({ apiKey, model }),
  dist = resolve("dist"),
}) {
  const app = express();
  const inFlight = new Map();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: production ? undefined : false,
      strictTransportSecurity: production ? undefined : false,
    }),
  );
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use("/api", (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.get("origin") !== origin || !req.is("application/json"))
    )
      return next(
        new ApiError(403, "Request origin or content type is not allowed."),
      );
    next();
  });
  app.use(express.json({ limit: "128kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 150,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Please wait a minute." },
    }),
  );
  const authLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Try again later." },
  });
  const cookieName = production ? "__Host-interprep" : "interprep";
  function getToken(req) {
    return (
      req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(cookieName + "="))
        ?.slice(cookieName.length + 1) ?? ""
    );
  }
  function setLogin(req, res, user) {
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM auth WHERE expires < ?").run(Date.now());
    db.prepare("DELETE FROM auth WHERE token=?").run(hashToken(getToken(req)));
    db.prepare("INSERT INTO auth VALUES(?,?,?)").run(
      hashToken(token),
      user,
      Date.now() + 7 * 86400000,
    );
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: production,
      sameSite: "strict",
      maxAge: 7 * 86400000,
      path: "/",
    });
  }
  function currentUser(req) {
    return db
      .prepare(
        `SELECT users.*, EXISTS(SELECT 1 FROM guest_users WHERE user_id=users.id) AS isGuest
      FROM auth JOIN users ON users.id=auth.user_id WHERE token=? AND auth.expires>?`,
      )
      .get(hashToken(getToken(req)), Date.now());
  }
  app.post("/api/auth/guest", authLimit, (req, res) => {
    z.object({}).strict().parse(req.body);
    // Retry in the same browser preserves the active identity and its progress.
    const existing = currentUser(req);
    if (existing) return res.json({ isGuest: !!existing.isGuest });
    const expired = db
      .prepare("SELECT user_id FROM guest_users WHERE expires<?")
      .all(Date.now());
    for (const { user_id } of expired) {
      if (![...inFlight.keys()].some((key) => key.startsWith(user_id + ":"))) {
        db.prepare("DELETE FROM users WHERE id=?").run(user_id);
        db.prepare("DELETE FROM usage WHERE scope=?").run(user_id);
      }
    }
    const id = randomUUID();
    db.exec("BEGIN");
    try {
      db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
        id,
        `guest-${id}@guest.invalid`,
        `${randomBytes(16).toString("hex")}:${randomBytes(64).toString("hex")}`,
        JSON.stringify({
          ...emptyWorkspace(),
          profile: { name: "Guest", role: "" },
        }),
      );
      db.prepare("INSERT INTO guest_users VALUES(?,?)").run(
        id,
        Date.now() + 7 * 86400000,
      );
      setLogin(req, res, id);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.status(201).json({ isGuest: true });
  });
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, assessmentConfigured: !!apiKey }),
  );
  app.post("/api/auth/register", authLimit, async (req, res) => {
    const { email, password, accessCode, name, confirmPassword } =
      registrationCredentials.parse(req.body);
    const policyError = registrationPasswordError(
      password,
      confirmPassword,
      name,
    );
    if (policyError) throw new ApiError(400, policyError);
    if (registrationCode && accessCode !== registrationCode)
      throw new ApiError(403, "A valid registration code is required.");
    const salt = randomBytes(16).toString("hex");
    const key = await derive(password, salt, 64, { N: 16384, r: 8, p: 1 });
    const id = randomUUID();
    try {
      db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
        id,
        email,
        `${salt}:${key.toString("hex")}`,
        JSON.stringify({ ...emptyWorkspace(), profile: { name, role: "" } }),
      );
    } catch (e) {
      if (e.code === "ERR_SQLITE_ERROR" && String(e.message).includes("UNIQUE"))
        throw new ApiError(
          409,
          "Unable to create this account. Try signing in.",
        );
      throw e;
    }
    setLogin(req, res, id);
    res.status(201).json({ email });
  });
  app.post("/api/auth/login", authLimit, async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const user = db
      .prepare(
        "SELECT * FROM users WHERE email=? AND NOT EXISTS(SELECT 1 FROM guest_users WHERE user_id=users.id)",
      )
      .get(email);
    const [salt, expected] = (
      user?.password ?? `${"0".repeat(32)}:${"0".repeat(128)}`
    ).split(":");
    const key = await derive(password, salt, 64, { N: 16384, r: 8, p: 1 });
    if (!timingSafeEqual(key, Buffer.from(expected, "hex")) || !user)
      throw new ApiError(401, "Email or password is incorrect.");
    setLogin(req, res, user.id);
    res.json({ email: user.email });
  });
  app.use("/api", (req, _res, next) => {
    const user = currentUser(req);
    if (!user) return next(new ApiError(401, "Please sign in to continue."));
    req.user = user;
    next();
  });
  app.post("/api/auth/logout", (req, res) => {
    db.prepare("DELETE FROM auth WHERE token=?").run(hashToken(getToken(req)));
    res.clearCookie(cookieName, {
      path: "/",
      httpOnly: true,
      secure: production,
      sameSite: "strict",
    });
    res.json({ ok: true });
  });
  app.get("/api/workspace", (req, res) => {
    const sessions = db
      .prepare("SELECT body FROM sessions WHERE user_id=? ORDER BY rowid DESC")
      .all(req.user.id)
      .map((r) => JSON.parse(r.body));
    res.json({
      ...JSON.parse(req.user.workspace),
      email: req.user.isGuest ? null : req.user.email,
      isGuest: !!req.user.isGuest,
      sessions: sessions
        .filter((s) => s.status === "completed")
        .map(publicSession),
      assessmentConfigured: !!apiKey,
    });
  });
  app.put("/api/workspace", (req, res) => {
    const data = workspaceSchema.parse(req.body);
    db.prepare("UPDATE users SET workspace=? WHERE id=?").run(
      JSON.stringify(data),
      req.user.id,
    );
    res.json(data);
  });
  app.post("/api/workspace/reset", (req, res) => {
    if ([...inFlight.keys()].some((k) => k.startsWith(req.user.id + ":")))
      throw new ApiError(
        409,
        "Wait for the active assessment before resetting.",
      );
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(req.user.id);
      db.prepare("UPDATE users SET workspace=? WHERE id=?").run(
        JSON.stringify(emptyWorkspace()),
        req.user.id,
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    res.json(emptyWorkspace());
  });
  app.get("/api/topics", (_req, res) => {
    const all = db
      .prepare("SELECT body FROM questions")
      .all()
      .map((r) => JSON.parse(r.body));
    res.json(
      [...new Set(all.map((q) => q.topic))].map((name) => ({
        name,
        count: all.filter((q) => q.topic === name).length,
      })),
    );
  });
  const getSession = (id, user) => {
    const row = db
      .prepare("SELECT body FROM sessions WHERE id=? AND user_id=?")
      .get(id, user);
    if (!row) throw new ApiError(404, "Practice session not found.");
    return JSON.parse(row.body);
  };
  const save = (s) =>
    db
      .prepare("UPDATE sessions SET body=? WHERE id=?")
      .run(JSON.stringify(s), s.id);
  app.get("/api/sessions/active", (req, res) => {
    const active = db
      .prepare("SELECT body FROM sessions WHERE user_id=? ORDER BY rowid DESC")
      .all(req.user.id)
      .map((r) => JSON.parse(r.body))
      .find((s) => s.status === "draft");
    res.json(active ? publicSession(active) : null);
  });
  app.post("/api/sessions", (req, res) => {
    const { topic } = z
      .object({ topic: z.string().max(100) })
      .strict()
      .parse(req.body);
    const active = db
      .prepare("SELECT body FROM sessions WHERE user_id=?")
      .all(req.user.id)
      .some((r) => JSON.parse(r.body).status === "draft");
    if (active)
      throw new ApiError(409, "Resume or discard your active session first.");
    const questions = db
      .prepare("SELECT body FROM questions ORDER BY id")
      .all()
      .map((r) => JSON.parse(r.body))
      .filter((q) => q.topic === topic);
    if (questions.length < 5)
      throw new ApiError(400, "Unknown or unavailable topic.");
    // Secure unbiased shuffle; snapshot full rubric so later bank edits cannot change an existing session.
    for (let i = questions.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    const s = {
      id: randomUUID(),
      date: new Date().toISOString(),
      topic,
      status: "draft",
      questions: questions.slice(0, 5),
      answers: Array(5).fill(""),
      assessments: Array(5).fill(null),
      score: 0,
    };
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
      s.id,
      req.user.id,
      JSON.stringify(s),
    );
    res.status(201).json(publicSession(s));
  });
  app.delete("/api/sessions/:id", (req, res) => {
    const s = getSession(req.params.id, req.user.id);
    if (s.status !== "draft")
      throw new ApiError(409, "Completed sessions cannot be discarded here.");
    if (inFlight.has(req.user.id + ":" + s.id))
      throw new ApiError(409, "Assessment is still running.");
    db.prepare("DELETE FROM sessions WHERE id=? AND user_id=?").run(
      s.id,
      req.user.id,
    );
    res.json({ ok: true });
  });
  const answerBody = z
    .object({
      index: z.number().int().min(0).max(4),
      answer: z.string().max(12000),
    })
    .strict();
  app.put("/api/sessions/:id/answer", (req, res) => {
    const { index, answer } = answerBody.parse(req.body);
    const s = getSession(req.params.id, req.user.id);
    if (s.status !== "draft" || inFlight.has(req.user.id + ":" + s.id))
      throw new ApiError(
        409,
        "This session cannot be edited while assessment is running or after completion.",
      );
    if (s.answers[index] !== answer) s.assessments[index] = null;
    s.answers[index] = answer;
    save(s);
    res.json(publicSession(s));
  });
  app.post("/api/sessions/:id/assess", async (req, res) => {
    const { index } = z
      .object({ index: z.number().int().min(0).max(4) })
      .strict()
      .parse(req.body);
    const s = getSession(req.params.id, req.user.id);
    const key = req.user.id + ":" + s.id;
    if (s.assessments[index]) return res.json(s.assessments[index]);
    if (s.status !== "draft" || !s.answers[index].trim())
      throw new ApiError(400, "Save an answer before requesting assessment.");
    if (inFlight.has(key))
      throw new ApiError(
        409,
        "An assessment is already running for this session.",
      );
    if (!apiKey)
      throw new ApiError(
        503,
        "Add OPENAI_API_KEY to the server .env file and restart to enable assessment. Your draft is saved.",
      );
    const day = new Date().toISOString().slice(0, 10);
    const scopes = [
      ["global", dailyLimit],
      [req.user.id, userDailyLimit],
    ];
    for (const [scope, limit] of scopes) {
      const row = db
        .prepare("SELECT count FROM usage WHERE day=? AND scope=?")
        .get(day, scope);
      if ((row?.count ?? 0) >= limit)
        throw new ApiError(
          429,
          "Daily assessment limit reached. Try again tomorrow.",
        );
    }
    db.exec("BEGIN");
    try {
      for (const [scope] of scopes)
        db.prepare(
          "INSERT INTO usage VALUES(?,?,1) ON CONFLICT(day,scope) DO UPDATE SET count=count+1",
        ).run(day, scope);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    inFlight.set(key, true);
    try {
      const result = await assess(s.questions[index], s.answers[index]);
      s.assessments[index] = result;
      save(s);
      res.json(result);
    } finally {
      inFlight.delete(key);
    }
  });
  app.post("/api/sessions/:id/complete", (req, res) => {
    const s = getSession(req.params.id, req.user.id);
    if (s.status === "completed") return res.json(publicSession(s));
    if (inFlight.has(req.user.id + ":" + s.id) || s.assessments.some((a) => !a))
      throw new ApiError(
        409,
        "Assess all five answers before completing the session.",
      );
    s.score = Math.round(
      s.assessments.reduce((n, a) => n + a.score, 0) / s.assessments.length,
    );
    s.status = "completed";
    s.date = new Date().toISOString();
    save(s);
    res.json(publicSession(s));
  });
  app.use("/api", (_req, _res, next) =>
    next(new ApiError(404, "API route not found.")),
  );
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(resolve(dist, "index.html")),
    );
  }
  app.use((err, _req, res, _next) => {
    const status = err instanceof z.ZodError ? 400 : (err.status ?? 500);
    if (status === 500) console.error("Server request failed:", err.name); // Never log candidate answers, credentials or provider headers.
    res.status(status).json({
      error:
        err instanceof z.ZodError
          ? "Invalid request data. Check the field lengths and values."
          : status >= 500 && !(err instanceof ApiError)
            ? "A server error occurred. Please try again."
            : err.message,
    });
  });
  return app;
}
