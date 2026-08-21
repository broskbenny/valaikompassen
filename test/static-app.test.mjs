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

test("app builds displayed questions from singleton and canonical source coding", () => {
  assert.match(app, /PARTIES\.map\(\(party\) => fetchText\(`data\/statements\/\$\{party\}\.jsonl`\)\)/);
  assert.match(app, /data\/sources\.json/);
  assert.match(app, /data\/question-bank\.json/);
  assert.match(app, /singleton_ids/);
  assert.match(app, /canonical_questions/);
  assert.match(app, /buildQuestionBank/);
  assert.match(app, /position_parties/);
});

test("party sources stay gated and multiple source positions are revealed only after answering", () => {
  assert.match(app, /summary\.tabIndex = answered \? 0 : -1/);
  assert.match(app, /!state\.answers\[current\.id\]/);
  assert.match(app, /event\.currentTarget\.open = false/);
  assert.match(app, /Stödjer påståendet/);
  assert.match(app, /Motsätter sig påståendet/);
});

test("old equal-per-party promise is removed from the UI", () => {
  assert.doesNotMatch(html, /3 per parti/);
  assert.doesNotMatch(html, /6 per parti/);
  assert.doesNotMatch(html, /10 per parti/);
  assert.match(html, /tvingar inte fram exakt lika många frågor per parti/);
});

test("responsive and reduced-motion CSS are present", () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
