export const PARTIES = ["S", "M", "SD", "C", "V", "KD", "MP", "L"];

export const ANSWER_VALUES = Object.freeze({
  very_bad: -2,
  bad: -1,
  good: 1,
  very_good: 2,
  unsure: null,
});

export function parseJsonLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Ogiltig JSONL på rad ${index + 1}: ${error.message}`);
      }
    });
}

export function shuffle(items, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function diversifyTopics(items, rng = Math.random) {
  const buckets = new Map();
  for (const item of shuffle(items, rng)) {
    const key = item.topic || "övrigt";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }

  const topicOrder = shuffle([...buckets.keys()], rng);
  const output = [];
  while (output.length < items.length) {
    let added = false;
    for (const topic of topicOrder) {
      const bucket = buckets.get(topic);
      if (bucket?.length) {
        output.push(bucket.shift());
        added = true;
      }
    }
    if (!added) break;
  }
  return output;
}

export function selectBalancedQuestions(statements, requestedSize = 48, rng = Math.random) {
  if (!Array.isArray(statements) || statements.length === 0) return [];

  const byParty = new Map(PARTIES.map((party) => [party, []]));
  for (const statement of statements) {
    if (byParty.has(statement.source_party)) byParty.get(statement.source_party).push(statement);
  }

  const availableParties = PARTIES.filter((party) => byParty.get(party).length > 0);
  if (!availableParties.length) return [];

  const maxSize = Math.min(Math.max(1, requestedSize), statements.length);
  const base = Math.floor(maxSize / availableParties.length);
  const remainder = maxSize % availableParties.length;
  const remainderOrder = shuffle(availableParties, rng);
  const targets = new Map();

  for (const party of availableParties) {
    const extra = remainderOrder.slice(0, remainder).includes(party) ? 1 : 0;
    targets.set(party, Math.min(byParty.get(party).length, base + extra));
  }

  let selected = [];
  for (const party of availableParties) {
    const diversified = diversifyTopics(byParty.get(party), rng);
    selected.push(...diversified.slice(0, targets.get(party)));
  }

  if (selected.length < maxSize) {
    const chosen = new Set(selected.map((item) => item.id));
    const remaining = diversifyTopics(
      statements.filter((item) => !chosen.has(item.id)),
      rng,
    );
    selected.push(...remaining.slice(0, maxSize - selected.length));
  }

  return shuffle(selected, rng);
}

export function computePartyResults(questions, answers) {
  const accum = new Map(PARTIES.map((party) => [party, { sum: 0, answered: 0, unsure: 0, total: 0 }]));

  for (const question of questions) {
    const row = accum.get(question.source_party);
    if (!row) continue;
    row.total += 1;
    const answer = answers[question.id];
    if (!answer) continue;
    if (answer === "unsure") {
      row.unsure += 1;
      continue;
    }
    const value = ANSWER_VALUES[answer];
    if (typeof value === "number") {
      row.sum += value;
      row.answered += 1;
    }
  }

  return PARTIES.map((party) => {
    const row = accum.get(party);
    const average = row.answered ? row.sum / row.answered : null;
    const score = average === null ? null : Math.round(((average + 2) / 4) * 100);
    return {
      party,
      score,
      average,
      answered: row.answered,
      unsure: row.unsure,
      total: row.total,
      confidence: row.answered >= 9 ? "hög" : row.answered >= 5 ? "medel" : "låg",
    };
  }).sort((a, b) => {
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score || b.answered - a.answered;
  });
}

export function answeredCount(questions, answers) {
  return questions.reduce((count, q) => count + (answers[q.id] ? 1 : 0), 0);
}

export function substantiveAnswerCount(questions, answers) {
  return questions.reduce((count, q) => count + (answers[q.id] && answers[q.id] !== "unsure" ? 1 : 0), 0);
}

export function createSessionId(now = Date.now) {
  return `session-${now}-${Math.random().toString(36).slice(2, 8)}`;
}
