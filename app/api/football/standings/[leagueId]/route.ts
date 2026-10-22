const competitions = new Set(["PL", "PD", "BL1", "SA", "FL1", "CL"]);

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/football/standings/[leagueId]">,
) {
  const { leagueId } = await params;
  if (!competitions.has(leagueId)) {
    return Response.json({ error: "Unsupported competition for this provider." }, { status: 400 });
  }
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    return Response.json(
      { error: "Football data is not configured. Add FOOTBALL_DATA_API_KEY to .env.local." },
      { status: 503 },
    );
  }
  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${leagueId}/standings`,
      { headers: { "X-Auth-Token": token }, signal: AbortSignal.timeout(8_000), next: { revalidate: 900 } },
    );
    if (!response.ok) {
      return Response.json(
        { error: response.status === 429 ? "Football provider rate limit reached." : `Provider returned HTTP ${response.status}.` },
        { status: response.status === 429 ? 429 : 502 },
      );
    }
    return Response.json(await response.json(), {
      headers: { "Cache-Control": "private, max-age=600, stale-while-revalidate=300" },
    });
  } catch {
    return Response.json({ error: "Football provider request timed out or could not connect." }, { status: 502 });
  }
}
