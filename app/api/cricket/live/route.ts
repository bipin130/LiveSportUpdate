import { getLiveMatches } from "@/lib/sports/providers";

export async function GET() {
  try {
    return Response.json(await getLiveMatches("cricket"), {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=30" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load cricket matches.";
    return Response.json({ error: message }, { status: 502 });
  }
}
