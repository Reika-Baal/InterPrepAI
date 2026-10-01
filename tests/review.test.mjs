import test from "node:test";
import assert from "node:assert/strict";
import { reviewAnswer } from "../src/review.mjs";
test("empty answers receive no score", () =>
  assert.equal(reviewAnswer("  ").score, 0));
test("specific examples and outcomes improve structure score", () => {
  const basic = reviewAnswer("I worked on this task.");
  const specific = reviewAnswer(
    "In my project I implemented a solution and reduced the runtime.",
  );
  assert.ok(specific.score > basic.score);
  assert.ok(specific.hasExample);
  assert.ok(specific.hasResult);
});
test("score stays bounded even for a long answer", () =>
  assert.equal(reviewAnswer("example result ".repeat(1000)).score, 100));
