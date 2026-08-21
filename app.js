import {
  PARTIES,
  parseJsonLines,
  selectBalancedQuestions,
  computePartyResults,
  answeredCount,
  substantiveAnswerCount,
  createSessionId,
  deriveVotePartyPositions,
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
const STORAGE_KEY = "valaikompassen.session.v4";

const state = {
  statements: [],
  sources: [],
  riksdagen: null,
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

function assertNoPositionConflict(id, support, oppose) {
  const overlap = support.filter((party) => oppose.includes(party));
  if (overlap.length) {
    throw new Error(`${id} har motstridiga källpositioner för: ${overlap.join(", ")}`);
  }
}

function buildQuestionBank(questionBank, rawStatements, voteData) {
  const rawById = new Map(rawStatements.map((row) => [row.id, row]));
  const voteQuestions = voteData?.questions || [];
  const mergeProgramIds = new Set(voteQuestions.flatMap((question) => question.merge_program_ids || []));
  const singletonIds = (questionBank.singleton_ids || []).filter((id) => !mergeProgramIds.has(id));
  const canonicalQuestions = questionBank.canonical_questions || [];
  const referencedIds = [
    ...(questionBank.singleton_ids || []),
    ...canonicalQuestions.flatMap((question) => [
      ...(question.positions?.support || []),
      ...(question.positions?.oppose || []),
    ]),
    ...mergeProgramIds,
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
  if (new Set(voteQuestions.map((question) => question.id)).size !== voteQuestions.length) {
    throw new Error("Voteringsbanken innehåller dubbla fråge-id:n.");
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
      vote_sources: [],
      position_parties: { support: [row.source_party], oppose: [] },
      source_kinds: ["program"],
    };
  });

  const mergedQuestions = canonicalQuestions.map((question) => {
    const supportRows = (question.positions?.support || []).map((id) => rawById.get(id));
    const opposeRows = (question.positions?.oppose || []).map((id) => rawById.get(id));
    const supportParties = unique(supportRows.map((row) => row.source_party));
    const opposeParties = unique(opposeRows.map((row) => row.source_party));
    assertNoPositionConflict(question.id, supportParties, opposeParties);

    return {
      id: question.id,
      statement: question.statement,
      topic: question.topic,
      type: question.type || "position",
      position_sources: { support: supportRows, oppose: opposeRows },
      vote_sources: [],
      position_parties: { support: supportParties, oppose: opposeParties },
      source_kinds: ["program"],
    };
  });

  const byId = new Map([...singletonQuestions, ...mergedQuestions].map((question) => [question.id, question]));

  for (const vote of voteQuestions) {
    const votePositions = deriveVotePartyPositions(vote);
    const mergedRows = (vote.merge_program_ids || []).map((id) => rawById.get(id));
    const mergedProgramParties = unique(mergedRows.map((row) => row.source_party));
    const existing = byId.get(vote.id);

    const support = unique([
      ...(existing?.position_parties?.support || []),
      ...mergedProgramParties,
      ...votePositions.support,
    ]);
    const oppose = unique([
      ...(existing?.position_parties?.oppose || []),
      ...votePositions.oppose,
    ]);
    assertNoPositionConflict(vote.id, support, oppose);

    byId.set(vote.id, {
      id: vote.id,
      statement: vote.statement,
      topic: vote.topic,
      type: vote.type || existing?.type || "position",
      position_sources: {
        support: unique([...(existing?.position_sources?.support || []), ...mergedRows]),
        oppose: existing?.position_sources?.oppose || [],
      },
      vote_sources: [...(existing?.vote_sources || []), vote],
      position_parties: { support, oppose },
      source_kinds: unique([...(existing?.source_kinds || []), ...(mergedRows.length ? ["program"] : []), "riksdag_vote"]),
    });
  }

  return [...byId.values()];
}

async function loadData() {
  try {
    const [sourceResponse, questionBank, voteData, ...statementTexts] = await Promise.all([
      fetchJson("data/sources.json"),
      fetchJson("data/question-bank.json"),
      fetchJson("data/riksdagen/votes.json"),
      ...PARTIES.map((party) => fetchText(`data/statements/${party}.jsonl`)),
    ]);

    const rawStatements = statementTexts
      .flatMap(parseJsonLines)
      .filter((row) => row.review?.status !== "rejected");

    state.sources = sourceResponse.sources || [];
    state.riksdagen = voteData;
    state.rawStatementCount = rawStatements.length;
    state.questionBankVersion = `${questionBank.version || "unknown"}+riksdag-${voteData.version || "unknown"}`;
    state.statements = buildQuestionBank(questionBank, rawStatements, voteData);
    state.loaded = true;
    const voteCount = voteData.questions?.length || 0;
    $("#load-status").textContent = `${state.statements.length} unika sakfrågor laddade från ${state.rawStatementCount} programrader och ${voteCount} handgranskade riksdagsomröstningar.`;
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
    version: 4,
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
  const canResume = saved?.version === 4
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
  if (!saved || saved.version !== 4 || saved.questionBankVersion !== state.questionBankVersion) return;
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

function renderVoteSource(vote) {
  const positions = deriveVotePartyPositions(vote);
  return `
    <div class="source-position-group vote-source">
      <h3>Riksdagsomröstning</h3>
      <div class="source-item">
        <strong>${escapeHtml(vote.source?.title || "Riksdagsbeslut")}</strong>
        <p>${escapeHtml(vote.source?.decision || "")}</p>
        <small>${escapeHtml(vote.source?.date || "")} · ${escapeHtml(vote.source?.rm || "")}:${escapeHtml(vote.source?.bet || "")} · punkt ${escapeHtml(vote.source?.point || "")}</small>
        <div class="vote-tallies">
          ${PARTIES.map((party) => {
            const tally = vote.party_tallies?.[party] || {};
            const stance = positions.support.includes(party)
              ? "stödjer"
              : positions.oppose.includes(party) ? "motsätter sig" : "ej kodad";
            return `<div class="vote-tally-row"><strong>${escapeHtml(PARTY_NAMES[party])}</strong><span>${escapeHtml(stance)} · Ja ${Number(tally.yes || 0)} · Nej ${Number(tally.no || 0)} · Avstår ${Number(tally.abstain || 0)} · Frånvarande ${Number(tally.absent || 0)}</span></div>`;
          }).join("")}
        </div>
        <p class="source-method-note">Partiposition kodas bara när minst ${Math.round(Number(vote.cohesion_threshold || 0.8) * 100)} % av partiets avgivna ja/nej-röster går åt samma håll och minst ${Number(vote.minimum_decisive_votes || 3)} ledamöter har röstat ja eller nej. Avstående och frånvaro blir aldrig automatiskt en position.</p>
        <a href="${escapeAttribute(vote.source?.url || state.riksdagen?.source_url || "")}" target="_blank" rel="noreferrer">Öppna omröstningen hos Riksdagen ↗</a>
      </div>
    </div>
  `;
}

function renderQuestionSource(question) {
  const supportRows = question.position_sources?.support || [];
  const opposeRows = question.position_sources?.oppose || [];
  const voteRows = question.vote_sources || [];
  if (!supportRows.length && !opposeRows.length && !voteRows.length) {
    $("#source-content").textContent = "Källuppgift saknas.";
    return;
  }

  const sourceCount = supportRows.length + opposeRows.length + voteRows.length;
  const intro = sourceCount > 1
    ? "Frågan kan ha stöd i flera källor. Varje källa visas separat; flera källor ger inte extra vikt i poängen."
    : "Källa och underlag:";

  $("#source-content").innerHTML = `
    <p>${escapeHtml(intro)}</p>
    ${renderSourceRows(supportRows, "Programkällor som stödjer påståendet")}
    ${renderSourceRows(opposeRows, "Programkällor som motsätter sig påståendet")}
    ${voteRows.map(renderVoteSource).join("")}
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

  $("#results-summary").textContent = `Du besvarade ${answered} av ${state.questions.length} frågor. ${substantive} svar räknas in; “vet ej” påverkar inte resultatet. Ett svar kan räknas för flera partier när deras position kan beläggas i partiprogram eller i en direkt riksdagsomröstning.`;
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
  const programSources = state.sources.map((source) => {
    const update = source.last_program_update ? ` · uppdaterat ${source.last_program_update}` : "";
    return `
      <div class="source-item">
        <strong>${escapeHtml(source.party_name)}</strong>
        <small>${escapeHtml(source.title)} · ${escapeHtml(source.adopted || "år saknas")}${escapeHtml(update)}</small><br>
        <a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">Originaldokument ↗</a>
      </div>
    `;
  }).join("");

  const riksdagenSource = state.riksdagen ? `
    <div class="source-item">
      <strong>Sveriges riksdag · öppna data</strong>
      <small>Direkta voteringsutfall från mandatperioden ${escapeHtml(state.riksdagen.scope?.mandate_period || "2022–2026")}. Endast manuellt granskade sakvoteringar används.</small><br>
      <a href="${escapeAttribute(state.riksdagen.source_url || "")}" target="_blank" rel="noreferrer">Riksdagens öppna data ↗</a>
    </div>
  ` : "";

  $("#source-list").innerHTML = programSources + riksdagenSource;
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
