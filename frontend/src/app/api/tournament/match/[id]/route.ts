import { NextRequest, NextResponse } from "next/server";
import { getTournament, saveTournament } from "@/src/lib/db";
import type { Match } from "@/src/lib/db";
import { propagateWinner } from "@/src/lib/bracket";

// PATCH /api/tournament/match/[id]  — body: { score1, score2, winner }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { score1, score2, winner } = await req.json();

  const tournament = await getTournament();
  const bracket = tournament.bracket;
  if (!bracket) {
    return NextResponse.json({ message: "No hay bracket generado" }, { status: 400 });
  }

  const apply = (m: Match): string | null => {
    if (winner && winner !== m.player1?.id && winner !== m.player2?.id) {
      return "El ganador no pertenece a este partido";
    }
    if (score1 !== undefined) m.score1 = score1 === null ? null : Number(score1);
    if (score2 !== undefined) m.score2 = score2 === null ? null : Number(score2);
    if (winner !== undefined) m.winner = winner;
    m.autoValidated = false; // edición manual
    return null;
  };

  // Partido por el 3er puesto (no propaga)
  const tp = bracket.thirdPlaceMatch;
  if (tp && tp.id === id) {
    const err = apply(tp);
    if (err) return NextResponse.json({ message: err }, { status: 400 });
    await saveTournament(tournament);
    return NextResponse.json({ bracket });
  }

  for (let rIdx = 0; rIdx < bracket.rounds.length; rIdx++) {
    const mIdx = bracket.rounds[rIdx].matches.findIndex((m) => m.id === id);
    if (mIdx === -1) continue;

    const err = apply(bracket.rounds[rIdx].matches[mIdx]);
    if (err) return NextResponse.json({ message: err }, { status: 400 });

    if (winner !== undefined) propagateWinner(bracket, rIdx, mIdx);

    await saveTournament(tournament);
    return NextResponse.json({ bracket });
  }

  return NextResponse.json({ message: "Partido no encontrado" }, { status: 404 });
}