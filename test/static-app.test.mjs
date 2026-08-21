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

test("app loads all eight party files and source registry", () => {
  assert.match(app, /PARTIES\.map\(\(party\) => fetchText\(`data\/statements\/\$\{party\}\.jsonl`\)\)/);
  assert.match(app, /data\/sources\.json/);
});

test("responsive and reduced-motion CSS are present", () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
