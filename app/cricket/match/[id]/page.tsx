import { MatchCenter } from "@/components/match-center";

export default async function CricketMatchPage({
  params,
}: PageProps<"/cricket/match/[id]">) {
  const { id } = await params;
  return <MatchCenter section="cricket-match" matchId={id} />;
}
