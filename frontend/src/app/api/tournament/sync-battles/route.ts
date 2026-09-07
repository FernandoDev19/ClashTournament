import { NextResponse } from "next/server";
import { getTournament, saveTournament } from "@/src/lib/db";
import type { CardItem } from "@/src/lib/db";

const CR_API_TOKEN = process.env.CR_API_TOKEN ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPlayerBattlelog(tag: string): Promise<any[]> {
  if (!CR_API_TOKEN) return [];
  const normalized = tag.startsWith("#") ? tag : `#${tag}`;
  const encoded = encodeURIComponent(normalized);
  const url = `https://api.clashroyale.com/v1/players/${encoded}/battlelog`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CR_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// POST /api/tournament/sync-battles
export async function POST() {
  const tournament = getTournament();

  if (!tournament.bracket) {
    return NextResponse.json(
      { message: "No hay bracket activo para sincronizar" },
      { status: 400 }
    );
  }

  let updatedCount = 0;
  const syncedMatches: string[] = [];

  for (let rIdx = 0; rIdx < tournament.bracket.rounds.length; rIdx++) {
    const round = tournament.bracket.rounds[rIdx];

    for (let mIdx = 0; mIdx < round.matches.length; mIdx++) {
      const match = round.matches[mIdx];
      if (!match.player1 || !match.player2) continue;

      const tag1 = match.player1.tag.toUpperCase();
      const tag2 = match.player2.tag.toUpperCase();

      // Fetch battlelog for player 1
      const battles = await fetchPlayerBattlelog(tag1);

      // Find match between tag1 and tag2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foundBattle = battles.find((b: any) => {
        const teamTag = b.team?.[0]?.tag?.toUpperCase();
        const oppTag = b.opponent?.[0]?.tag?.toUpperCase();
        return (
          (teamTag === tag1 && oppTag === tag2) ||
          (teamTag === tag2 && oppTag === tag1)
        );
      });

      if (foundBattle) {
        const teamIsP1 = foundBattle.team?.[0]?.tag?.toUpperCase() === tag1;
        const p1Data = teamIsP1 ? foundBattle.team?.[0] : foundBattle.opponent?.[0];
        const p2Data = teamIsP1 ? foundBattle.opponent?.[0] : foundBattle.team?.[0];

        const score1 = p1Data?.crowns ?? 0;
        const score2 = p2Data?.crowns ?? 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deck1: CardItem[] = (p1Data?.cards || []).map((c: any) => ({
          name: c.name,
          level: c.level,
          maxLevel: c.maxLevel,
          iconUrl: c.iconUrls?.medium || c.iconUrls?.evoMedium || "",
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deck2: CardItem[] = (p2Data?.cards || []).map((c: any) => ({
          name: c.name,
          level: c.level,
          maxLevel: c.maxLevel,
          iconUrl: c.iconUrls?.medium || c.iconUrls?.evoMedium || "",
        }));

        let winnerId: string | null = null;
        if (score1 > score2) winnerId = match.player1.id;
        else if (score2 > score1) winnerId = match.player2.id;

        match.score1 = score1;
        match.score2 = score2;
        match.deck1 = deck1;
        match.deck2 = deck2;
        match.battleTime = foundBattle.battleTime;
        match.autoValidated = true;

        if (winnerId && match.winner !== winnerId) {
          match.winner = winnerId;
          updatedCount++;
          syncedMatches.push(`${match.player1.name} (${score1}) vs ${match.player2.name} (${score2})`);

          // Propagate winner to next round
          const nextRound = tournament.bracket.rounds[rIdx + 1];
          if (nextRound) {
            const nextMatchIndex = Math.floor(mIdx / 2);
            const nextMatch = nextRound.matches[nextMatchIndex];
            if (nextMatch) {
              const winnerPlayer =
                match.player1.id === winnerId ? match.player1 : match.player2;
              if (mIdx % 2 === 0) {
                nextMatch.player1 = winnerPlayer;
              } else {
                nextMatch.player2 = winnerPlayer;
              }
            }
          }
        }
      }
    }
  }

  saveTournament(tournament);

  return NextResponse.json({
    message: updatedCount > 0 ? `${updatedCount} partida(s) sincronizada(s)` : "No se detectaron nuevas partidas en la API",
    updatedCount,
    syncedMatches,
    bracket: tournament.bracket,
  });
}
