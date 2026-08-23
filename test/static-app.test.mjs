import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("app has all required views and answer options", () => {
  for (const id of ["start-view", "quiz-view", "results-view", "about-view", "error-view"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const answer of ["very_bad", "bad", "good", "very_good", "unsure"]) {
    assert.match(html, new RegExp(`data-answer="${answer}"`));
  }
});

test("app builds displayed questions from programs, votes and issue clusters", () => {
  assert.match(app, /PARTIES\.map\(\(party\) => fetchText\(`data\/statements\/\$\{party\}\.jsonl`\)\)/);
  assert.match(app, /data\/sources\.json/);
  assert.match(app, /data\/question-bank\.json/);
  assert.match(app, /data\/riksdagen\/votes\.json/);
  assert.match(app, /data\/issue-clusters\.json/);
  assert.match(app, /singleton_ids/);
  assert.match(app, /canonical_questions/);
  assert.match(app, /merge_program_ids/);
  assert.match(app, /deriveVotePartyPositions/);
  assert.match(app, /applyIssueClusters/);
  assert.match(app, /issue_cluster_id/);
  assert.match(app, /source_kinds/);
});

test("party sources stay gated and all evidence is revealed only after answering", () => {
  assert.match(app, /summary\.tabIndex = answered \? 0 : -1/);
  assert.match(app, /!state\.answers\[current\.id\]/);
  assert.match(app, /event\.currentTarget\.open = false/);
  assert.match(app, /Programkällor som stödjer påståendet/);
  assert.match(app, /Programkällor som motsätter sig påståendet/);
  assert.match(app, /Riksdagsomröstning/);
  assert.match(app, /Ja \$\{Number\(tally\.yes/);
  assert.match(app, /Avstår/);
  assert.match(app, /Frånvarande/);
  assert.match(app, /Relaterad frågefamilj/);
});

test("new cluster layer invalidates older saved sessions", () => {
  assert.match(app, /valaikompassen\.session\.v5/);
  assert.match(app, /saved\?\.version === 5/);
  assert.match(app, /\+riksdag-/);
  assert.match(app, /\+clusters-/);
});

test("old equal-per-party promise is removed from the UI", () => {
  assert.doesNotMatch(html, /3 per parti/);
  assert.doesNotMatch(html, /6 per parti/);
  assert.doesNotMatch(html, /10 per parti/);
  assert.match(html, /Frågekvaliteten sänks aldrig för att fylla en partikvot/);
});

test("UI documents parliamentary interpretation and exact clustering guardrails", () => {
  assert.match(html, /En rå Ja-röst är inte automatiskt ett sakpolitiskt Ja/);
  assert.match(html, /minst 80 procent/);
  assert.match(html, /Avstående och frånvaro räknas inte som ställningstagande/);
  assert.match(html, /Relaterade frågefamiljer/);
  assert.match(html, /Frågorna slås alltså inte ihop bara för att de korrelerar politiskt/);
});

test("responsive and reduced-motion CSS are present", () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
