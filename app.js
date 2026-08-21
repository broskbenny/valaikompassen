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
const STORAGE_KEY = "valaikompassen.session.v3";

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

function unique(values) {
  return [...new Set(values)];
}

function buildQuestionBank(questionBank, rawStatements) {
  const rawById = new Map(rawStatements.map((row) => [row.id, row]));
  const singletonIds = questionBank.singleton_ids || [];
  const canonicalQuestions = questionBank.canonical_questions || [];
  const referencedIds = [
    ...singletonIds,
    ...canonicalQuestions.flatMap((question) => [
      ...(question.positions?.support || []),
      ...(question.positions?.oppose || []),
    ]),
  ];
  const missingIds = unique(referencedIds.filter((id) => !rawById.has(id)));

  if (missingIds.length) {
    throw new Error(`Frågebanken hänvisar till saknade källrader: ${missingIds.join(", ")}`);
  }
  if (new Set(singletonIds).size !== singletonIds.length) {
    throw new Error("Frågebanken innehåller dubbla singleton-id:n.");
  }
  if (new Set(canonicalQuestions.map((question) => question.id)).size !== canonicalQuestions.length) {
    throw new Error("Frågebanken innehåller dubbla canonical-id:n.");
  }

  const singletonQuestions = singletonIds.map((id) => {
    const row = rawById.get(id);
    const override = questionBank.overrides?.[id] || {};
    return {
      id,
      statement: override.statement || row.statement,
      topic: override.topic || row.topic,
      type: override.type || row.type,
      position_sources: { support: [row], oppose: [] },
      position_parties: { support: [row.source_party], oppose: [] },
    };
  });

  const mergedQuestions = canonicalQuestions.map((question) => {
    const supportRows = (question.positions?.support || []).map((id) => rawById.get(id));
    const opposeRows = (question.positions?.oppose || []).map((id) => rawById.get(id));
    const supportParties = unique(supportRows.map((row) => row.source_party));
    const opposeParties = unique(opposeRows.map((row) => row.source_party));
    const overlap = supportParties.filter((party) => opposeParties.includes(party));
    if (overlap.length) {
      throw new Error(`${question.id} kodar samma parti på båda sidor: ${overlap.join(", ")}`);
    }

    return {
      id: question.id,
      statement: question.statement,
      topic: question.topic,
      type: question.type || "position",
      position_sources: { support: supportRows, oppose: opposeRows },
      position_parties: { support: supportParties, oppose: opposeParties },
    };
  });

  return [...singletonQuestions, ...mergedQuestions];
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

    state.sources = sourceResponse.sources || [];
    state.rawStatementCount = rawStatements.length;
    state.questionBankVersion = questionBank.version || null;
    state.statements = buildQuestionBank(questionBank, rawStatements);
    state.loaded = true;
    $("#load-status").textContent = `${state.statements.length} unika, handgranskade sakfrågor laddade från ${state.rawStatementCount} källspårade programrader.`;
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
    version: 3,
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
  const canResume = saved?.version === 3
    && saved?.questionBankVersion === state.questionBankVersion
    && saved?.questionIds?.length
    && saved.questionIds.some((id) => state.statements.some((q) => q.id === id));
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
  if (!saved || saved.questionBankVersion !== state.questionBankVersion) return;
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
  summary.textContent = answered ? "Visa källor och partier" : "Visa källor efter att jag svarat";
  summary.tabIndex = answered ? 0 : -1;
  summary.setAttribute("aria-disabled", answered ? "false" : "true");
  renderQuestionSource(question);
}

function renderSourceRows(rows, heading) {
  if (!rows?.length) return "";
  return `
    <div class="source-position-group">
      <h3>${escapeHtml(heading)}</h3>
      ${rows.map((row) => {
        const source = state.sources.find((item) => item.document_id === row.source?.document_id);
        if (!source) return "";
        const page = row.source?.pdf_page ? `, PDF-sida ${row.source.pdf_page}` : "";
        const section = row.source?.section ? ` · ${row.source.section}` : "";
        return `
          <div class="source-item">
            <strong>${escapeHtml(source.party_name)}</strong>
            <p>${escapeHtml(row.statement)}</p>
            <small>${escapeHtml(source.title)}${escapeHtml(page)}${escapeHtml(section)}</small><br>
            <a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">Öppna originaldokumentet ↗</a>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderQuestionSource(question) {
  const supportRows = question.position_sources?.support || [];
  const opposeRows = question.position_sources?.oppose || [];
  if (!supportRows.length && !opposeRows.length) {
    $("#source-content").textContent = "Källuppgift saknas.";
    return;
  }

  const sourceCount = supportRows.length + opposeRows.length;
  const intro = sourceCount > 1
    ? "Frågan sammanför en gemensam sakpolitisk kärna. De källnära parafraserna nedan visar respektive partis nyans."
    : "Källnära parafras och originalkälla:";

  $("#source-content").innerHTML = `
    <p>${escapeHtml(intro)}</p>
    ${renderSourceRows(supportRows, "Stödjer påståendet")}
    ${renderSourceRows(opposeRows, "Motsätter sig påståendet")}
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

  $("#results-summary").textContent = `Du besvarade ${answered} av ${state.questions.length} frågor. ${substantive} svar räknas in; “vet ej” påverkar inte resultatet. Ett svar kan räknas för flera partier när deras program uttryckligen intar samma ståndpunkt.`;
  $("#results-list").innerHTML = results.map((result, i) => {
    const score = result.score ?? 0;
    const scoreLabel = result.score === null ? "–" : String(result.score);
    return `
      <div class="result-row">
        <div class="result-rank">${i + 1}</div>
        <div class="result-party">
          <strong>${escapeHtml(PARTY_NAMES[result.party])}</strong>
          <small>${result.answered}/${result.total} källkodade positioner bedömda</small>
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
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return String(value).replace(/[&<>\"]/g, (char) => entities[char]);
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
