import "server-only";
import { normalizeCricketMatches, normalizeFootballMatches } from "./normalize";
import type { FeedResponse, Sport } from "./types";

const timeoutMs = 8_000;

export async function getLiveMatches(sport: Sport): Promise<FeedResponse> {
  const updatedAt = new Date().toISOString();
  if (sport === "football") {
    const token = process.env.FOOTBALL_DATA_API_KEY;
    if (!token) {
      return {
        matches: [],
        source: "preview",
        configured: false,
        updatedAt,
        message: "Football data is not configured. Add FOOTBALL_DATA_API_KEY to .env.local.",
      };
    }
    const response = await fetch("https://api.football-data.org/v4/matches?status=LIVE", {
      headers: { "X-Auth-Token": token },
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      throw new Error(
        response.status === 429
          ? "Football provider rate limit reached. Try again later."
          : `Football provider returned HTTP ${response.status}. Check your API key and plan.`,
      );
    }
    return {
      matches: normalizeFootballMatches(await response.json()),
      source: "provider",
      configured: true,
      updatedAt: new Date().toISOString(),
    };
  }

  const key = process.env.CRICKET_API_KEY;
  if (!key) {
    return {
      matches: [],
      source: "preview",
      configured: false,
      updatedAt,
      message: "Cricket data is not configured. Add CRICKET_API_KEY to .env.local.",
    };
  }
  const url = new URL("https://api.cricapi.com/v1/currentMatches");
  url.searchParams.set("apikey", key);
  url.searchParams.set("offset", "0");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "Cricket provider rate limit reached. Try again later."
        : `Cricket provider returned HTTP ${response.status}. Check your API key and plan.`,
    );
  }
  const payload: unknown = await response.json();
  const root = payload as { status?: unknown; reason?: unknown };
  if (root.status === "failure") {
    throw new Error(typeof root.reason === "string" ? root.reason : "Cricket provider rejected the request.");
  }
  return {
    matches: normalizeCricketMatches(payload),
    source: "provider",
    configured: true,
    updatedAt: new Date().toISOString(),
  };
}
