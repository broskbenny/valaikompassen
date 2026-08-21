import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PARTIES, parseJsonLines } from "../src/core.js";

const bank = JSON.parse(await readFile(new URL("../data/question-bank.json", import.meta.url), "utf8"));

const rawRows = (
  await Promise.all(
    PARTIES.map(async (party) => {
      const text = await readFile(new URL(`../data/statements/${party}.jsonl`, import.meta.url), "utf8");
      return parseJsonLines(text);
    }),
  )
).flat();

const rawById = new Map(rawRows.map((row) => [row.id, row]));
const canonical = bank.canonical_questions || [];
const singletonIds = bank.singleton_ids || [];
const canonicalSourceIds = canonical.flatMap((question) => [
  ...(question.positions?.support || []),
  ...(question.positions?.oppose || []),
]);
const usedSourceIds = [...singletonIds, ...canonicalSourceIds];

test("v0.3 question bank contains unique displayed questions and valid source rows", () => {
  assert.equal(bank.purpose, "canonical_compass_question_bank");
  assert.equal(bank.version, "0.3.0");
  assert.equal(singletonIds.length + canonical.length, 99);
  assert.ok(singletonIds.length + canonical.length >= 80, "deep mode needs at least 80 unique questions");
  assert.equal(new Set(singletonIds).size, singletonIds.length);
  assert.equal(new Set(canonical.map((question) => question.id)).size, canonical.length);
  assert.equal(new Set(usedSourceIds).size, usedSourceIds.length, "a source row should not create duplicate displayed questions");

  for (const id of usedSourceIds) {
    const row = rawById.get(id);
    assert.ok(row, `${id} must reference an existing raw statement`);
    assert.notEqual(row.review?.status, "rejected", `${id} cannot reference a rejected source row`);
  }
});

test("canonical questions merge equivalent sources but keep support and opposition explicit", () => {
  assert.ok(canonical.length >= 15);
  assert.ok(canonical.some((question) => (question.positions?.support || []).length >= 2));
  assert.ok(canonical.some((question) => (question.positions?.oppose || []).length >= 1));

  for (const question of canonical) {
    assert.match(question.id, /^Q-/);
    assert.ok(question.statement?.length >= 8);
    assert.ok(question.topic?.length >= 2);
    const supportParties = new Set((question.positions?.support || []).map((id) => rawById.get(id)?.source_party));
    const opposeParties = new Set((question.positions?.oppose || []).map((id) => rawById.get(id)?.source_party));
    for (const party of supportParties) {
      assert.ok(!opposeParties.has(party), `${question.id} cannot code ${party} on both sides`);
    }
  }
});

test("known platitudes and self-justifying maxims stay excluded", () => {
  for (const id of Object.keys(bank.excluded_regressions || {})) {
    assert.ok(!usedSourceIds.includes(id), `${id} is a documented regression and must stay excluded`);
  }

  assert.equal(
    rawById.get("M-2021-009")?.statement,
    "Det offentliga ska inte utföra uppgifter som andra kan göra lika bra eller bättre.",
  );
  assert.equal(
    rawById.get("M-2021-031")?.statement,
    "Sjukvården ska präglas av hög kvalitet, god tillgänglighet och valfrihet.",
  );
});

test("quality is not weakened to force an equal per-party quota", () => {
  const coverage = Object.fromEntries(PARTIES.map((party) => [party, 0]));
  for (const id of singletonIds) coverage[rawById.get(id).source_party] += 1;
  for (const question of canonical) {
    const parties = new Set(
      [...(question.positions?.support || []), ...(question.positions?.oppose || [])]
        .map((id) => rawById.get(id).source_party),
    );
    for (const party of parties) coverage[party] += 1;
  }

  for (const party of PARTIES) assert.ok(coverage[party] >= 5, `${party} needs at least five source-coded issues`);
  assert.ok(new Set(Object.values(coverage)).size > 1, "bank should not manufacture equal quotas by accepting weaker questions");
});
