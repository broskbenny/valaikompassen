import test from "node:test";
import assert from "node:assert/strict";
import {
  parseJsonLines,
  selectBalancedQuestions,
  computePartyResults,
  answeredCount,
  substantiveAnswerCount,
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

test("parseJsonLines parses JSONL and ignores blank lines", () => {
  const parsed = parseJsonLines('{"id":1}\n\n{"id":2}\n');
  assert.deepEqual(parsed, [{ id: 1 }, { id: 2 }]);
});

test("balanced selection gives every party the same count when divisible", () => {
  const selected = selectBalancedQuestions(fixture(), 48, seededRng(42));
  assert.equal(selected.length, 48);
  for (const party of PARTIES) {
    assert.equal(selected.filter((q) => q.source_party === party).length, 6);
  }
  assert.equal(new Set(selected.map((q) => q.id)).size, 48);
});

test("balanced selection preserves topic diversity", () => {
  const selected = selectBalancedQuestions(fixture(), 32, seededRng(7));
  for (const party of PARTIES) {
    const partyRows = selected.filter((q) => q.source_party === party);
    assert.equal(new Set(partyRows.map((q) => q.topic)).size, 4);
  }
});

test("party result maps -2..2 to 0..100", () => {
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
