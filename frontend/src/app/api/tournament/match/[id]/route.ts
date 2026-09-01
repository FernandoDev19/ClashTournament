import { NextRequest, NextResponse } from "next/server";
import { getTournament, saveTournament } from "@/src/lib/db";

// PATCH /api/tournament/match/[id]
// Body: { score1, score2, winner } — winner is the player id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { score1, score2, winner } = body;

  const tournament = getTournament();

  if (!tournament.bracket) {
    return NextResponse.json(
      { message: "No hay bracket generado" },
      { status: 400 }
    );
  }

  let matchFound = false;

  for (const round of tournament.bracket.rounds) {
    const match = round.matches.find((m) => m.id === id);
    if (match) {
      match.score1 = score1 !== undefined ? Number(score1) : match.score1;
      match.score2 = score2 !== undefined ? Number(score2) : match.score2;
      match.winner = winner !== undefined ? winner : match.winner;
      matchFound = true;

      // Propagate winner to next round
      if (winner) {
        const roundIndex = tournament.bracket.rounds.indexOf(round);
        const nextRound = tournament.bracket.rounds[roundIndex + 1];
        if (nextRound) {
          const matchIndex = round.matches.indexOf(match);
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const nextMatch = nextRound.matches[nextMatchIndex];
          if (nextMatch) {
            const winnerPlayer =
              match.player1?.id === winner ? match.player1 : match.player2;
            if (winnerPlayer) {
              if (matchIndex % 2 === 0) {
                nextMatch.player1 = winnerPlayer;
              } else {
                nextMatch.player2 = winnerPlayer;
              }
            }
          }
        }
      }

      break;
    }
  }

  if (!matchFound) {
    return NextResponse.json({ message: "Partido no encontrado" }, { status: 404 });
  }

  saveTournament(tournament);
  return NextResponse.json({ bracket: tournament.bracket });
}
