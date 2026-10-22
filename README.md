# Matchday

A responsive cricket and football scoreboard built with Next.js 16 App Router, TypeScript, and Tailwind CSS. The app starts without credentials in a clearly marked sample-preview mode. Provider keys are read only on the server.

## Run locally

```powershell
pnpm install
Copy-Item .env.example .env.local
# Add your provider keys to .env.local, then:
pnpm dev
```

Open http://localhost:3000. `.env.local` is ignored by Git. Never prefix provider credentials with `NEXT_PUBLIC_`.

Useful commands:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Data providers and setup

### Cricket — CricketData.org

1. Register and request a key at [cricketdata.org](https://cricketdata.org/).
2. Add `CRICKET_API_KEY=your_key` to `.env.local`.
3. The server calls the provider's current-matches endpoint and normalizes its response.

The provider advertises live/current match feeds and cricket data, but competition coverage and detailed scorecards/ball-by-ball depend on its current plan and endpoints. This first integration only displays fields included in the current-matches response; it does not fabricate missing innings or commentary. Check the provider's [pricing page](https://cricketdata.org/pricing/) for current limits.

### Football — football-data.org

1. Register at [football-data.org](https://www.football-data.org/client/register).
2. Add `FOOTBALL_DATA_API_KEY=your_token` to `.env.local`.
3. The server uses the v4 matches and competition standings endpoints.

Its [documentation](https://www.football-data.org/documentation/quickstart) describes competition, match, and standings resources. Free-plan competitions, request quotas, live freshness, and data depth are restricted; live scores, events, statistics, or lineups may require a paid plan or may not be supplied. A provider error is shown rather than silently substituting scores. The app requests live match feeds on page entry and then at a 30-minute default interval (configurable to 5 or 15 minutes in Settings). It refreshes only while the tab is visible.

## Preview versus provider data

| Page | Data available |
| --- | --- |
| `/`, `/cricket`, `/football`, `/search`, `/favorites` | Labeled sample fixtures until a provider is configured; configured live feeds replace preview rows |
| `/cricket/live`, `/football/live` | Provider's current live-match response, or labeled preview |
| `/cricket/series` | Honest empty state until series feeds are wired |
| `/football/leagues` | Competition links; provider availability varies |
| `/football/standings/[leagueId]` | Explicitly labeled sample table in this initial version |
| `/cricket/match/[id]`, `/football/match/[id]` | Summary where present in the current feed; unsupported scorecards, commentary, events, and lineups are disclosed |
| `/settings` | Provider setup, local refresh preference, and appearance |

Favorites and display preferences are stored in this browser's local storage. Provider keys remain server-only. The app does not scrape score sites, generate random scores, or present preview data as real.

## Routes

- `/` — Match dashboard
- `/cricket`, `/cricket/live`, `/cricket/series`, `/cricket/match/[id]`
- `/football`, `/football/live`, `/football/leagues`, `/football/match/[id]`
- `/football/standings/[leagueId]`
- `/search`, `/favorites`, `/settings`

API handlers are under `app/api`. Shared provider normalization and preview fixtures are under `lib/sports`. Routes use the App Router's `route.ts` convention.

## Provider research notes

The initial provider selection favors documented server-side JSON APIs that offer registration and broad schedule/score resources. CricketData.org current-matches data and football-data.org's competition/match/standings endpoints are used; their coverage is not equivalent. API-Football and SportScore documentation pages were not accessible during implementation, so they were not selected. CricketDatabase documentation advertises a free key with 50 calls/day and detailed historical ball-by-ball data, but that quota/feature set is distinct from the CricketData.org integration above. Re-check all provider plan terms and attribution requirements before production or commercial use.

## Known limitations

- Provider plans and coverage change; a valid key does not guarantee live coverage for every listed competition.
- The application currently normalizes cricket current-match summaries and football live match summaries. It does not yet call scorecard, commentary, event, lineup, statistics, top-scorer, or cricket series APIs.
- Standings are labeled sample data until a provider response is normalized into the UI.
- Provider calls are cached briefly to reduce quota use. Provider limits remain authoritative.
