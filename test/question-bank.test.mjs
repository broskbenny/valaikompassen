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
const approvedIds = PARTIES.flatMap((party) => bank.question_ids_by_party?.[party] || []);

test("question bank is an explicit, unique allowlist with enough depth per party", () => {
  assert.equal(bank.purpose, "compass_question_allowlist");
  assert.equal(new Set(approvedIds).size, approvedIds.length);
  assert.ok(approvedIds.length >= 100, "question bank should stay broad while remaining selective");

  for (const party of PARTIES) {
    const ids = bank.question_ids_by_party?.[party] || [];
    assert.ok(
      ids.length >= bank.minimum_questions_per_party,
      `${party} needs at least ${bank.minimum_questions_per_party} approved questions`,
    );
    for (const id of ids) {
      const row = rawById.get(id);
      assert.ok(row, `${id} must reference an existing raw statement`);
      assert.equal(row.source_party, party, `${id} must remain assigned to ${party}`);
      assert.notEqual(row.review?.status, "rejected", `${id} cannot reference a rejected source row`);
    }
  }
});

test("known platitudes are excluded from compass use", () => {
  for (const id of Object.keys(bank.excluded_regressions || {})) {
    assert.ok(!approvedIds.includes(id), `${id} is a documented regression and must stay excluded`);
  }

  assert.ok(!approvedIds.includes("M-2021-031"));
  assert.equal(rawById.get("M-2021-031")?.statement, "Sjukvården ska präglas av hög kvalitet, god tillgänglighet och valfrihet.");
  assert.ok(!approvedIds.includes("S-2025-002"));
});

test("80-question mode can still draw ten questions from every party", () => {
  for (const party of PARTIES) {
    assert.ok((bank.question_ids_by_party?.[party] || []).length >= 10, `${party} lacks deep-mode coverage`);
  }
});
