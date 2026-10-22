import { MatchCenter } from "@/components/match-center";

export default async function FootballStandingsPage({
  params,
}: PageProps<"/football/standings/[leagueId]">) {
  const { leagueId } = await params;
  return <MatchCenter section="football-standings" leagueId={leagueId} />;
}
