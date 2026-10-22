import { MatchCenter } from "@/components/match-center";

export default async function FootballMatchPage({
  params,
}: PageProps<"/football/match/[id]">) {
  const { id } = await params;
  return <MatchCenter section="football-match" matchId={id} />;
}
