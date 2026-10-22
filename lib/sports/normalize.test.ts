import { describe, expect, it } from "vitest";
import { normalizeCricketMatches, normalizeFootballMatches } from "./normalize";

describe("normalizeFootballMatches", () => {
  it("normalizes match scores, live state, and team names", () => {
    const matches = normalizeFootballMatches({
      matches: [{
        id: 42,
        status: "IN_PLAY",
        minute: 63,
        utcDate: "2026-10-22T18:00:00Z",
        homeTeam: { name: "Sample Home", tla: "HOM" },
        awayTeam: { name: "Sample Away", tla: "AWY" },
        competition: { name: "Sample League", code: "SPL" },
        score: { fullTime: { home: 2, away: 1 } },
      }],
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      id: "football-42",
      status: "live",
      statusText: "63′",
      homeTeam: "Sample Home",
      awayTeam: "Sample Away",
      homeScore: "2",
      awayScore: "1",
      source: "provider",
    });
  });

  it("maps completed and postponed states and ignores incomplete records", () => {
    const matches = normalizeFootballMatches({
      matches: [
        { id: 1, status: "FINISHED", homeTeam: { name: "A" }, awayTeam: { name: "B" }, competition: { name: "Cup" } },
        { id: 2, status: "POSTPONED", homeTeam: { name: "C" }, awayTeam: { name: "D" }, competition: { name: "Cup" } },
        { id: 3, status: "SCHEDULED", homeTeam: { name: "Missing competition" } },
      ],
    });
    expect(matches.map((match) => match.status)).toEqual(["finished", "postponed"]);
  });

  it("rejects an unexpected provider response", () => {
    expect(() => normalizeFootballMatches({ matches: {} })).toThrow(/unexpected matches response/i);
  });
});

describe("normalizeCricketMatches", () => {
  it("normalizes team, innings score, and current state", () => {
    const matches = normalizeCricketMatches({
      data: [{
        id: "abc",
        name: "Sample T20",
        matchType: "t20",
        teams: ["Sample A", "Sample B"],
        score: [{ r: 150, w: 4, o: 18.2 }],
        status: "In Progress",
        venue: "Sample ground",
      }],
    });
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      id: "cricket-abc",
      status: "live",
      homeTeam: "Sample A",
      awayTeam: "Sample B",
      homeScore: "150/4 (18.2)",
      venue: "Sample ground",
      source: "provider",
    });
  });

  it("rejects invalid cricket payloads and skips malformed rows", () => {
    expect(() => normalizeCricketMatches({ data: "bad" })).toThrow(/unexpected matches response/i);
    expect(normalizeCricketMatches({ data: [{ id: "bad", teams: ["Only one"] }] })).toEqual([]);
  });
});
