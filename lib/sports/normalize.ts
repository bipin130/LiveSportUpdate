import type { SportMatch } from "./types";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function normalizeFootballMatches(payload: unknown): SportMatch[] {
  const root = record(payload);
  if (!root || !Array.isArray(root.matches)) {
    throw new Error("Football provider returned an unexpected matches response.");
  }

  return root.matches.flatMap((item): SportMatch[] => {
    const match = record(item);
    const home = record(match?.homeTeam);
    const away = record(match?.awayTeam);
    const competition = record(match?.competition);
    const score = record(match?.score);
    const fullTime = record(score?.fullTime);
    if (!match || !home || !away || !competition) return [];

    const apiStatus = text(match.status) ?? "SCHEDULED";
    const status =
      apiStatus === "FINISHED" || apiStatus === "AWARDED"
        ? "finished"
        : apiStatus === "LIVE" || apiStatus === "IN_PLAY" || apiStatus === "PAUSED"
          ? "live"
          : apiStatus === "POSTPONED" || apiStatus === "SUSPENDED" || apiStatus === "CANCELLED"
            ? "postponed"
            : "scheduled";
    const minute = number(match.minute);
    const homeGoals = text(fullTime?.home);
    const awayGoals = text(fullTime?.away);

    return [{
      id: `football-${text(match.id) ?? crypto.randomUUID()}`,
      sport: "football",
      competition: text(competition.name) ?? "Football",
      competitionCode: text(competition.code),
      stage: text(match.stage),
      homeTeam: text(home.name) ?? "Home team",
      awayTeam: text(away.name) ?? "Away team",
      homeCode: text(home.tla),
      awayCode: text(away.tla),
      homeScore: homeGoals,
      awayScore: awayGoals,
      status,
      statusText:
        status === "live"
          ? minute
            ? `${minute}′`
            : apiStatus.replaceAll("_", " ")
          : status === "finished"
            ? "Full time"
            : status === "postponed"
              ? apiStatus
              : "Scheduled",
      startsAt: text(match.utcDate),
      minute,
      venue: text(match.venue),
      source: "provider",
    }];
  });
}

export function normalizeCricketMatches(payload: unknown): SportMatch[] {
  const root = record(payload);
  if (!root || !Array.isArray(root.data)) {
    throw new Error("Cricket provider returned an unexpected matches response.");
  }

  return root.data.flatMap((item): SportMatch[] => {
    const match = record(item);
    const teams = match?.teams;
    const scores = match?.score;
    if (!match || !Array.isArray(teams) || teams.length < 2) return [];
    const names = teams.filter((team): team is string => typeof team === "string");
    if (names.length < 2) return [];
    const scoreText = (value: unknown) => {
      if (!Array.isArray(value)) return undefined;
      return value.flatMap((entry) => {
        const innings = record(entry);
        const runs = text(innings?.r);
        const wickets = text(innings?.w);
        const overs = text(innings?.o);
        return runs !== undefined ? [`${runs}/${wickets ?? "?"}${overs ? ` (${overs})` : ""}`] : [];
      }).join(" & ") || undefined;
    };
    const state = text(match.status) ?? "";
    const lowerState = state.toLowerCase();
    const status = lowerState.includes("live") || lowerState.includes("innings") || lowerState.includes("in progress")
      ? "live"
      : lowerState.includes("result") || lowerState.includes("won") || lowerState.includes("draw")
        ? "finished"
        : lowerState.includes("postpon")
          ? "postponed"
          : "scheduled";

    return [{
      id: `cricket-${text(match.id) ?? crypto.randomUUID()}`,
      sport: "cricket",
      competition: text(match.series) ?? "Cricket",
      stage: text(match.name) ?? text(match.matchType),
      homeTeam: names[0],
      awayTeam: names[1],
      homeCode: names[0].slice(0, 3).toUpperCase(),
      awayCode: names[1].slice(0, 3).toUpperCase(),
      homeScore: scoreText(scores),
      status,
      statusText: state || (status === "live" ? "Live" : status === "finished" ? "Result" : "Scheduled"),
      startsAt: text(match.dateTimeGMT),
      venue: text(match.venue),
      detail: text(match.status),
      source: "provider",
    }];
  });
}
