import { openDb } from "./db.mjs";
import { createApp } from "./app.mjs";
const production = process.env.NODE_ENV === "production";
const origin = process.env.APP_ORIGIN ?? "http://localhost:5173";
if (
  production &&
  (!origin.startsWith("https://") || !process.env.REGISTRATION_CODE)
)
  throw Error("Production requires HTTPS APP_ORIGIN and a REGISTRATION_CODE.");
const db = openDb(
  process.env.DATABASE_PATH ?? "./server/data/interprepai.sqlite",
);
const limit = (key, fallback) => {
  const n = Number(process.env[key] ?? fallback);
  if (!Number.isInteger(n) || n < 1) throw Error(`Invalid ${key}`);
  return n;
};
const app = createApp({
  db,
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  origin,
  production,
  registrationCode: process.env.REGISTRATION_CODE,
  dailyLimit: limit("DAILY_ASSESSMENT_LIMIT", 200),
  userDailyLimit: limit("USER_DAILY_ASSESSMENT_LIMIT", 30),
});
const server = app.listen(
  Number(process.env.PORT ?? 3001),
  process.env.HOST ?? "127.0.0.1",
  () =>
    console.log(
      "InterPrepAI API listening; assessment " +
        (process.env.OPENAI_API_KEY ? "configured" : "requires OPENAI_API_KEY"),
    ),
);
function stop() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
