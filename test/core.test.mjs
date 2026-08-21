import test from "node:test";
import assert from "node:assert/strict";
import {
  parseJsonLines,
  selectBalancedQuestions,
  computePartyResults,
  answeredCount,
  substantiveAnswerCount,
  getQuestionPartyPositions,
  PARTIES,
} from "../src/core.js";

function seededRng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function fixture(perParty = 12) {
  return PARTIES.flatMap((party) =>
    Array.from({ length: perParty }, (_, i) => ({
      id: `${party}-${i}`,
      source_party: party,
      topic: `topic-${i % 4}`,
      statement: `${party} ${i}`,
    })),
  );
}

function partyCoverage(questions) {
  const counts = Object.fromEntries(PARTIES.map((party) => [party, 0]));
  for (const question of questions) {
    const positions = getQuestionPartyPositions(question);
    for (const party of new Set([...positions.support, ...positions.oppose])) counts[party] += 1;
  }
  return counts;
}

test("parseJsonLines parses JSONL and ignores blank lines", () => {
  const parsed = parseJsonLines('{"id":1}\n\n{"id":2}\n');
  assert.deepEqual(parsed, [{ id: 1 }, { id: 2 }]);
});

test("balanced selection keeps legacy single-party coverage even without hard quotas", () => {
  const selected = selectBalancedQuestions(fixture(), 48, seededRng(42));
  assert.equal(selected.length, 48);
  assert.equal(new Set(selected.map((q) => q.id)).size, 48);
  const counts = partyCoverage(selected);
  assert.equal(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)), 0);
});

test("shared questions count as coverage for every explicitly coded party", () => {
  const question = {
    id: "Q-shared",
    topic: "energi",
    position_parties: { support: ["C", "MP"], oppose: ["SD", "KD"] },
  };
  const positions = getQuestionPartyPositions(question);
  assert.deepEqual(positions.support, ["C", "MP"]);
  assert.deepEqual(positions.oppose, ["SD", "KD"]);
});

test("explicit opposition inverts the answer instead of treating silence as opposition", () => {
  const questions = [
    {
      id: "Q-nuclear",
      position_parties: { support: ["C", "MP"], oppose: ["SD"] },
    },
  ];
  const results = computePartyResults(questions, { "Q-nuclear": "very_good" });
  assert.equal(results.find((r) => r.party === "C").score, 100);
  assert.equal(results.find((r) => r.party === "MP").score, 100);
  assert.equal(results.find((r) => r.party === "SD").score, 0);
  assert.equal(results.find((r) => r.party === "M").score, null);
  assert.equal(results.find((r) => r.party === "M").total, 0);
});

test("party result maps -2..2 to 0..100 for source-party questions", () => {
  const questions = [
    { id: "S-1", source_party: "S" },
    { id: "S-2", source_party: "S" },
    { id: "M-1", source_party: "M" },
  ];
  const answers = { "S-1": "very_good", "S-2": "good", "M-1": "very_bad" };
  const results = computePartyResults(questions, answers);
  const s = results.find((r) => r.party === "S");
  const m = results.find((r) => r.party === "M");
  assert.equal(s.score, 88);
  assert.equal(m.score, 0);
});

test("unsure does not affect the party score", () => {
  const questions = [
    { id: "V-1", source_party: "V" },
    { id: "V-2", source_party: "V" },
  ];
  const answers = { "V-1": "very_good", "V-2": "unsure" };
  const v = computePartyResults(questions, answers).find((r) => r.party === "V");
  assert.equal(v.score, 100);
  assert.equal(v.answered, 1);
  assert.equal(v.unsure, 1);
  assert.equal(answeredCount(questions, answers), 2);
  assert.equal(substantiveAnswerCount(questions, answers), 1);
});
