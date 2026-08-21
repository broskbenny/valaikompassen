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

test("app loads the source corpus through the explicit question allowlist", () => {
  assert.match(app, /PARTIES\.map\(\(party\) => fetchText\(`data\/statements\/\$\{party\}\.jsonl`\)\)/);
  assert.match(app, /data\/sources\.json/);
  assert.match(app, /data\/question-bank\.json/);
  assert.match(app, /question_ids_by_party/);
  assert.match(app, /approvedIds\.map\(\(id\) => rawById\.get\(id\)\)/);
});

test("party source stays gated until the current question is answered", () => {
  assert.match(app, /summary\.tabIndex = answered \? 0 : -1/);
  assert.match(app, /!state\.answers\[current\.id\]/);
  assert.match(app, /event\.currentTarget\.open = false/);
});

test("responsive and reduced-motion CSS are present", () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
