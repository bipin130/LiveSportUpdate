export type Sport = "cricket" | "football";
export type MatchStatus = "live" | "scheduled" | "finished" | "postponed";

export interface SportMatch {
  id: string;
  sport: Sport;
  competition: string;
  competitionCode?: string;
  stage?: string;
  homeTeam: string;
  awayTeam: string;
  homeCode?: string;
  awayCode?: string;
  homeScore?: string;
  awayScore?: string;
  status: MatchStatus;
  statusText: string;
  startsAt?: string;
  minute?: number;
  venue?: string;
  detail?: string;
  source: "preview" | "provider";
}

export interface FeedResponse {
  matches: SportMatch[];
  source: "preview" | "provider";
  configured: boolean;
  updatedAt: string;
  message?: string;
}
