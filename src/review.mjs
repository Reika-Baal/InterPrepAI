/** Offline demonstration only. This checks answer structure, not factual correctness. */
export function reviewAnswer(answer) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasExample =
    /\b(example|project|team|built|implemented|developed|situation)\b/i.test(
      answer,
    );
  const hasResult =
    /\b(result|improved|learned|achieved|reduced|increased|because|therefore)\b/i.test(
      answer,
    );
  const score = Math.min(
    100,
    (words ? 20 : 0) +
      Math.min(40, Math.floor(words / 2)) +
      (hasExample ? 20 : 0) +
      (hasResult ? 20 : 0),
  );
  return {
    score,
    words,
    hasExample,
    hasResult,
    advice: !words
      ? "Write an answer before requesting a review."
      : words < 30
        ? "Add more detail: explain your approach and why you chose it."
        : !hasExample
          ? "Include a specific example from a project or experience."
          : !hasResult
            ? "Finish with the outcome or what you learned."
            : "You included an example and an outcome. Check accuracy, relevance and clarity before using this answer.",
  };
}
