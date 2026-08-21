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

export function getQuestionPartyPositions(question) {
  const explicit = question?.position_parties;
  if (explicit) {
    return {
      support: [...new Set((explicit.support || []).filter((party) => PARTIES.includes(party)))],
      oppose: [...new Set((explicit.oppose || []).filter((party) => PARTIES.includes(party)))],
    };
  }

  if (PARTIES.includes(question?.source_party)) {
    return { support: [question.source_party], oppose: [] };
  }

  return { support: [], oppose: [] };
}

function partiesForQuestion(question) {
  const positions = getQuestionPartyPositions(question);
  return [...new Set([...positions.support, ...positions.oppose])];
}

export function selectBalancedQuestions(statements, requestedSize = 48, rng = Math.random) {
  if (!Array.isArray(statements) || statements.length === 0) return [];

  const maxSize = Math.min(Math.max(1, requestedSize), statements.length);
  const remaining = shuffle(statements, rng);
  const selected = [];
  const coverage = new Map(PARTIES.map((party) => [party, 0]));
  const topicsByParty = new Map(PARTIES.map((party) => [party, new Set()]));

  while (selected.length < maxSize && remaining.length) {
    const availableParties = PARTIES.filter((party) =>
      remaining.some((question) => partiesForQuestion(question).includes(party)),
    );

    let candidates = remaining;
    if (availableParties.length) {
      const minimumCoverage = Math.min(...availableParties.map((party) => coverage.get(party)));
      const targetParties = shuffle(
        availableParties.filter((party) => coverage.get(party) === minimumCoverage),
        rng,
      );
      const targetParty = targetParties[0];
      candidates = remaining.filter((question) => partiesForQuestion(question).includes(targetParty));
    }

    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const question of shuffle(candidates, rng)) {
      const parties = partiesForQuestion(question);
      const topic = question.topic || "övrigt";
      const score = parties.reduce((sum, party) => {
        const underRepresentation = 10 / (1 + coverage.get(party));
        const topicBonus = topicsByParty.get(party).has(topic) ? 0 : 2;
        return sum + underRepresentation + topicBonus;
      }, 0);

      if (score > bestScore) {
        best = question;
        bestScore = score;
      }
    }

    if (!best) best = remaining[0];
    selected.push(best);
    remaining.splice(remaining.findIndex((question) => question.id === best.id), 1);

    const topic = best.topic || "övrigt";
    for (const party of partiesForQuestion(best)) {
      coverage.set(party, coverage.get(party) + 1);
      topicsByParty.get(party).add(topic);
    }
  }

  return shuffle(selected, rng);
}

export function computePartyResults(questions, answers) {
  const accum = new Map(PARTIES.map((party) => [party, { sum: 0, answered: 0, unsure: 0, total: 0 }]));

  for (const question of questions) {
    const positions = getQuestionPartyPositions(question);
    const directions = new Map();
    for (const party of positions.support) directions.set(party, 1);
    for (const party of positions.oppose) {
      if (!directions.has(party)) directions.set(party, -1);
    }

    const answer = answers[question.id];
    for (const [party, direction] of directions) {
      const row = accum.get(party);
      if (!row) continue;
      row.total += 1;
      if (!answer) continue;
      if (answer === "unsure") {
        row.unsure += 1;
        continue;
      }
      const value = ANSWER_VALUES[answer];
      if (typeof value === "number") {
        row.sum += value * direction;
        row.answered += 1;
      }
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
      coverage: row.total ? row.answered / row.total : 0,
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
