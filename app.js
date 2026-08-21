import {
  PARTIES,
  parseJsonLines,
  selectBalancedQuestions,
  computePartyResults,
  answeredCount,
  substantiveAnswerCount,
  createSessionId,
} from "./src/core.js";

const PARTY_NAMES = {
  S: "Socialdemokraterna",
  M: "Moderaterna",
  SD: "Sverigedemokraterna",
  C: "Centerpartiet",
  V: "Vänsterpartiet",
  KD: "Kristdemokraterna",
  MP: "Miljöpartiet",
  L: "Liberalerna",
};

const TYPE_NAMES = { proposal: "Förslag", position: "Ställningstagande" };
const STORAGE_KEY = "valaikompassen.session.v2";

const state = {
  statements: [],
  sources: [],
  questions: [],
  answers: {},
  index: 0,
  sessionId: null,
  loaded: false,
  rawStatementCount: 0,
  questionBankVersion: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

async function loadData() {
  try {
    const [sourceResponse, questionBank, ...statementTexts] = await Promise.all([
      fetchJson("data/sources.json"),
      fetchJson("data/question-bank.json"),
      ...PARTIES.map((party) => fetchText(`data/statements/${party}.jsonl`)),
    ]);

    const rawStatements = statementTexts
      .flatMap(parseJsonLines)
      .filter((row) => row.review?.status !== "rejected");
    const rawById = new Map(rawStatements.map((row) => [row.id, row]));
    const approvedIds = PARTIES.flatMap((party) => questionBank.question_ids_by_party?.[party] || []);
    const missingIds = approvedIds.filter((id) => !rawById.has(id));

    if (missingIds.length) {
      throw new Error(`Frågebanken hänvisar till saknade källrader: ${missingIds.join(", ")}`);
    }
    if (new Set(approvedIds).size !== approvedIds.length) {
      throw new Error("Frågebanken innehåller dubbla statement-id:n.");
    }

    state.sources = sourceResponse.sources || [];
    state.rawStatementCount = rawStatements.length;
    state.questionBankVersion = questionBank.version || null;
    state.statements = approvedIds.map((id) => rawById.get(id));
    state.loaded = true;
    $("#load-status").textContent = `${state.statements.length} handgranskade kompassfrågor laddade från ${state.rawStatementCount} källspårade programrader.`;
    $("#start-button").disabled = false;
    renderSourceList();
    offerResume();
  } catch (error) {
    console.error(error);
    showError(`Kontrollera att sidan körs via en webbserver och att datafilerna finns. ${error.message}`);
  }
}

function setView(name) {
  $$(".view").forEach((view) => view.classList.add("hidden"));
  $(`#${name}-view`).classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "auto" });
  $("#main").focus({ preventScroll: true });
}

function saveSession() {
  if (!state.sessionId || !state.questions.length) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 2,
    questionBankVersion: state.questionBankVersion,
    sessionId: state.sessionId,
    questionIds: state.questions.map((q) => q.id),
    answers: state.answers,
    index: state.index,
    savedAt: new Date().toISOString(),
  }));
}

function readSavedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function offerResume() {
  const saved = readSavedSession();
  const canResume = saved?.questionIds?.length && saved.questionIds.some((id) => state.statements.some((q) => q.id === id));
  $("#resume-button").classList.toggle("hidden", !canResume);
}

function startSession() {
  if (!state.loaded) return;
  const length = Number($("input[name='length']:checked").value || 48);
  state.questions = selectBalancedQuestions(state.statements, length);
  state.answers = {};
  state.index = 0;
  state.sessionId = createSessionId();
  saveSession();
  setView("quiz");
  renderQuestion();
}

function resumeSession() {
  const saved = readSavedSession();
  if (!saved) return;
  const byId = new Map(state.statements.map((q) => [q.id, q]));
  state.questions = saved.questionIds.map((id) => byId.get(id)).filter(Boolean);
  state.answers = saved.answers || {};
  state.index = Math.min(saved.index || 0, Math.max(0, state.questions.length - 1));
  state.sessionId = saved.sessionId || createSessionId();
  setView("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = state.questions[state.index];
  if (!question) return showResults();

  const answered = state.answers[question.id];
  $("#progress-label").textContent = `${state.index + 1} / ${state.questions.length}`;
  $("#progress-bar").style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
  $("#topic-label").textContent = question.topic || "Övrigt";
  $("#type-label").textContent = TYPE_NAMES[question.type] || "Ställningstagande";
  $("#question-text").textContent = question.statement;

  $$(".answer-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.answer === answered);
    button.setAttribute("aria-pressed", button.dataset.answer === answered ? "true" : "false");
  });

  $("#previous-button").disabled = state.index === 0;
  $("#next-button").disabled = !answered;
  $("#next-button").textContent = state.index === state.questions.length - 1 ? "Visa resultat" : "Nästa";

  const details = $("#source-details");
  const summary = details.querySelector("summary");
  details.open = false;
  details.classList.toggle("locked", !answered);
  summary.textContent = answered ? "Visa källan" : "Visa källan efter att jag svarat";
  summary.tabIndex = answered ? 0 : -1;
  summary.setAttribute("aria-disabled", answered ? "false" : "true");
  renderQuestionSource(question);
}

function renderQuestionSource(question) {
  const source = state.sources.find((item) => item.document_id === question.source?.document_id);
  if (!source) {
    $("#source-content").textContent = "Källuppgift saknas.";
    return;
  }
  const page = question.source?.pdf_page ? `, PDF-sida ${question.source.pdf_page}` : "";
  const section = question.source?.section ? ` · ${question.source.section}` : "";
  $("#source-content").innerHTML = `
    <strong>${escapeHtml(source.party_name)}</strong><br>
    ${escapeHtml(source.title)}${escapeHtml(page)}${escapeHtml(section)}<br>
    <a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">Öppna originaldokumentet ↗</a>
  `;
}

function setAnswer(answer) {
  const question = state.questions[state.index];
  if (!question) return;
  state.answers[question.id] = answer;
  saveSession();
  renderQuestion();
}

function nextQuestion() {
  const question = state.questions[state.index];
  if (!question || !state.answers[question.id]) return;
  if (state.index >= state.questions.length - 1) return showResults();
  state.index += 1;
  saveSession();
  renderQuestion();
}

function previousQuestion() {
  if (state.index <= 0) return;
  state.index -= 1;
  saveSession();
  renderQuestion();
}

function showResults() {
  if (!state.questions.length) return;
  const answered = answeredCount(state.questions, state.answers);
  const substantive = substantiveAnswerCount(state.questions, state.answers);
  const results = computePartyResults(state.questions, state.answers);

  $("#results-summary").textContent = `Du besvarade ${answered} av ${state.questions.length} frågor. ${substantive} svar räknas in i poängen; “vet ej” påverkar inte resultatet.`;
  $("#results-list").innerHTML = results.map((result, i) => {
    const score = result.score ?? 0;
    const scoreLabel = result.score === null ? "–" : String(result.score);
    return `
      <div class="result-row">
        <div class="result-rank">${i + 1}</div>
        <div class="result-party">
          <strong>${escapeHtml(PARTY_NAMES[result.party])}</strong>
          <small>${result.answered}/${result.total} bedömda · säkerhet ${result.confidence}</small>
        </div>
        <div class="score-track" aria-label="${scoreLabel} av 100"><div class="score-fill" style="width:${score}%"></div></div>
        <div class="result-score">${scoreLabel}</div>
      </div>
    `;
  }).join("");

  saveSession();
  setView("results");
}

function renderSourceList() {
  $("#source-list").innerHTML = state.sources.map((source) => {
    const update = source.last_program_update ? ` · uppdaterat ${source.last_program_update}` : "";
    return `
      <div class="source-item">
        <strong>${escapeHtml(source.party_name)}</strong>
        <small>${escapeHtml(source.title)} · ${escapeHtml(source.adopted || "år saknas")}${escapeHtml(update)}</small><br>
        <a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">Originaldokument ↗</a>
      </div>
    `;
  }).join("");
}

function showAbout() { setView("about"); }
function showHome() { setView("start"); offerResume(); }
function showError(message) {
  $("#error-message").textContent = message;
  setView("error");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[char]));
}
function escapeAttribute(value = "") { return escapeHtml(value); }

$$('[data-action="home"]').forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); showHome(); }));
$$('[data-action="about"]').forEach((button) => button.addEventListener("click", showAbout));
$$('input[name="length"]').forEach((input) => input.addEventListener("change", () => {
  $$(".length-option").forEach((label) => label.classList.toggle("selected", label.querySelector("input").checked));
}));
$$(".answer-button").forEach((button) => button.addEventListener("click", () => setAnswer(button.dataset.answer)));
$("#start-button").addEventListener("click", startSession);
$("#resume-button").addEventListener("click", resumeSession);
$("#next-button").addEventListener("click", nextQuestion);
$("#previous-button").addEventListener("click", previousQuestion);
$("#show-results-early").addEventListener("click", showResults);
$("#restart-button").addEventListener("click", () => { localStorage.removeItem(STORAGE_KEY); showHome(); startSession(); });
$("#source-details").addEventListener("toggle", (event) => {
  const current = state.questions[state.index];
  if (event.currentTarget.open && current && !state.answers[current.id]) {
    event.currentTarget.open = false;
  }
});

$("#start-button").disabled = true;
loadData();
