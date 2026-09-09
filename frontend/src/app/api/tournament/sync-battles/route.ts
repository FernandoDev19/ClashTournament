import { NextResponse } from "next/server";
import { getTournament, saveTournament } from "@/src/lib/db";
import type { CardItem, Match, MatchPlayer } from "@/src/lib/db";

const CR_API_TOKEN = process.env.CR_API_TOKEN ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPlayerBattlelog(tag: string): Promise<any[]> {
  if (!CR_API_TOKEN) return [];
  const normalized = tag.startsWith("#") ? tag : `#${tag}`;
  const encoded = encodeURIComponent(normalized);
  const url = `https://proxy.royaleapi.dev/v1/players/${encoded}/battlelog`;

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

/**
 * Intenta sincronizar un partido individual (Bo3) contra el battlelog de la API.
 * Devuelve true si el partido cambió (score o ganador).
 */
async function syncSingleMatch(match: Match): Promise<boolean> {
  if (!match.player1 || !match.player2) return false;

  const tag1 = match.player1.tag.toUpperCase();
  const tag2 = match.player2.tag.toUpperCase();

  const battles = await fetchPlayerBattlelog(tag1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchBattles = battles.filter((b: any) => {
    const teamTag = b.team?.[0]?.tag?.toUpperCase();
    const oppTag = b.opponent?.[0]?.tag?.toUpperCase();
    return (
      (teamTag === tag1 && oppTag === tag2) ||
      (teamTag === tag2 && oppTag === tag1)
    );
  });

  if (matchBattles.length === 0) return false;

  // La API devuelve las batallas de más reciente a más antigua.
  // Se invierten para evaluar la serie Bo3 en orden cronológico.
  const chronologicalBattles = [...matchBattles].reverse();

  let wins1 = 0;
  let wins2 = 0;

  for (const b of chronologicalBattles) {
    if (wins1 >= 2 || wins2 >= 2) break;

    const teamIsP1 = b.team?.[0]?.tag?.toUpperCase() === tag1;
    const p1Data = teamIsP1 ? b.team?.[0] : b.opponent?.[0];
    const p2Data = teamIsP1 ? b.opponent?.[0] : b.team?.[0];

    const c1 = p1Data?.crowns ?? 0;
    const c2 = p2Data?.crowns ?? 0;

    if (c1 > c2) wins1++;
    else if (c2 > c1) wins2++;
  }

  let winnerId: string | null = null;
  if (wins1 >= 2) winnerId = match.player1.id;
  else if (wins2 >= 2) winnerId = match.player2.id;

  const mostRecentBattle = matchBattles[0];
  const teamIsP1 = mostRecentBattle.team?.[0]?.tag?.toUpperCase() === tag1;
  const p1Data = teamIsP1 ? mostRecentBattle.team?.[0] : mostRecentBattle.opponent?.[0];
  const p2Data = teamIsP1 ? mostRecentBattle.opponent?.[0] : mostRecentBattle.team?.[0];

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

  const scoreChanged = match.score1 !== wins1 || match.score2 !== wins2;
  const winnerChanged = match.winner !== winnerId;

  if (!scoreChanged && !winnerChanged) return false;

  match.score1 = wins1;
  match.score2 = wins2;
  match.winner = winnerId;
  match.deck1 = deck1;
  match.deck2 = deck2;
  match.battleTime = mostRecentBattle.battleTime;
  match.autoValidated = true;

  return true;
}

// POST /api/tournament/sync-battles
export async function POST() {
  const tournament = await getTournament();

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
      const changed = await syncSingleMatch(match);

      if (changed) {
        updatedCount++;
        if (match.winner && match.player1 && match.player2) {
          syncedMatches.push(
            `${match.player1.name} (${match.score1}) vs ${match.player2.name} (${match.score2})`
          );
        }

        const winnerPlayer: MatchPlayer | null = match.winner
          ? match.player1?.id === match.winner
            ? match.player1
            : match.player2
          : null;

        const loserPlayer: MatchPlayer | null = match.winner
          ? match.player1?.id === match.winner
            ? match.player2 ?? null
            : match.player1 ?? null
          : null;

        // Propagar ganador a la siguiente ronda
        const nextRound = tournament.bracket.rounds[rIdx + 1];
        if (nextRound) {
          const nextMatchIndex = Math.floor(mIdx / 2);
          const nextMatch = nextRound.matches[nextMatchIndex];
          if (nextMatch) {
            if (mIdx % 2 === 0) {
              nextMatch.player1 = winnerPlayer;
            } else {
              nextMatch.player2 = winnerPlayer;
            }
          }
        }

        // Si esta es la ronda de semifinal, mandar al perdedor al partido de 3er puesto
        const isSemifinalRound = rIdx === tournament.bracket.rounds.length - 2;
        if (isSemifinalRound && tournament.bracket.thirdPlaceMatch) {
          const tp = tournament.bracket.thirdPlaceMatch;
          const slot: "player1" | "player2" = mIdx % 2 === 0 ? "player1" : "player2";
          if (tp[slot]?.id !== loserPlayer?.id) {
            tp[slot] = loserPlayer;
            tp.winner = null;
            tp.score1 = null;
            tp.score2 = null;
            tp.autoValidated = false;
          }
        }
      }
    }
  }

  // Sincronizar también el partido por el 3er puesto (no propaga a ninguna ronda)
  if (tournament.bracket.thirdPlaceMatch) {
    const changed = await syncSingleMatch(tournament.bracket.thirdPlaceMatch);
    if (changed) {
      updatedCount++;
      const tp = tournament.bracket.thirdPlaceMatch;
      if (tp.winner && tp.player1 && tp.player2) {
        syncedMatches.push(
          `🥉 ${tp.player1.name} (${tp.score1}) vs ${tp.player2.name} (${tp.score2})`
        );
      }
    }
  }

  await saveTournament(tournament);

  return NextResponse.json({
    message:
      updatedCount > 0
        ? `${updatedCount} partida(s) sincronizada(s)`
        : "No se detectaron nuevas partidas en la API",
    updatedCount,
    syncedMatches,
    bracket: tournament.bracket,
  });
}