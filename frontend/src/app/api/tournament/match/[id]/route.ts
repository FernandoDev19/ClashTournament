import { NextRequest, NextResponse } from "next/server";
import { getTournament, saveTournament } from "@/src/lib/db";
import type { MatchPlayer } from "@/src/lib/db";

// PATCH /api/tournament/match/[id]
// Body: { score1, score2, winner } — winner es el id del jugador (o null para limpiar)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { score1, score2, winner } = body;

  const tournament = await getTournament();

  if (!tournament.bracket) {
    return NextResponse.json(
      { message: "No hay bracket generado" },
      { status: 400 }
    );
  }

  // ─ Partido por el 3er puesto: no propaga a ninguna ronda.
  if (tournament.bracket.thirdPlaceMatch && tournament.bracket.thirdPlaceMatch.id === id) {
    const match = tournament.bracket.thirdPlaceMatch;
    match.score1 = score1 !== undefined ? Number(score1) : match.score1;
    match.score2 = score2 !== undefined ? Number(score2) : match.score2;
    match.winner = winner !== undefined ? winner : match.winner;

    await saveTournament(tournament);
    return NextResponse.json({ bracket: tournament.bracket });
  }

  let matchFound = false;

  for (const round of tournament.bracket.rounds) {
    const match = round.matches.find((m) => m.id === id);
    if (match) {
      match.score1 = score1 !== undefined ? Number(score1) : match.score1;
      match.score2 = score2 !== undefined ? Number(score2) : match.score2;
      match.winner = winner !== undefined ? winner : match.winner;
      matchFound = true;

      if (winner !== undefined) {
        const roundIndex = tournament.bracket.rounds.indexOf(round);
        const matchIndex = round.matches.indexOf(match);

        const winnerPlayer: MatchPlayer | null =
          winner === match.player1?.id
            ? match.player1
            : winner === match.player2?.id
            ? match.player2
            : null;

        const loserPlayer: MatchPlayer | null = winner
          ? winner === match.player1?.id
            ? match.player2
            : winner === match.player2?.id
            ? match.player1
            : null
          : null;

        // Propagar ganador a la siguiente ronda
        const nextRound = tournament.bracket.rounds[roundIndex + 1];
        if (nextRound) {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const nextMatch = nextRound.matches[nextMatchIndex];
          if (nextMatch) {
            if (matchIndex % 2 === 0) {
              nextMatch.player1 = winnerPlayer;
            } else {
              nextMatch.player2 = winnerPlayer;
            }
          }
        }

        // Si esta es la ronda de semifinal, mandar al perdedor al partido de 3er puesto
        const isSemifinalRound = roundIndex === tournament.bracket.rounds.length - 2;
        if (isSemifinalRound && tournament.bracket.thirdPlaceMatch) {
          const tp = tournament.bracket.thirdPlaceMatch;
          const slot: "player1" | "player2" = matchIndex % 2 === 0 ? "player1" : "player2";
          if (tp[slot]?.id !== loserPlayer?.id) {
            tp[slot] = loserPlayer;
            tp.winner = null;
            tp.score1 = null;
            tp.score2 = null;
          }
        }
      }

      break;
    }
  }

  if (!matchFound) {
    return NextResponse.json({ message: "Partido no encontrado" }, { status: 404 });
  }

  await saveTournament(tournament);
  return NextResponse.json({ bracket: tournament.bracket });
}