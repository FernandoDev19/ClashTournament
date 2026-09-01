import { NextRequest, NextResponse } from "next/server";
import { getTournament, saveTournament, getPlayers, generateBracket } from "@/src/lib/db";

// GET /api/tournament
export async function GET() {
  const tournament = getTournament();
  const players = getPlayers();
  const acceptedPlayers = players.filter((p) => p.status === "accepted");

  return NextResponse.json({
    ...tournament,
    acceptedCount: acceptedPlayers.length,
    pendingCount: players.filter((p) => p.status === "pending").length,
    totalRegistered: players.length,
  });
}

// POST /api/tournament — update config or generate bracket
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, tournamentDate, maxPlayers, status } = body;

  const tournament = getTournament();

  if (action === "generate_bracket") {
    const acceptedPlayers = getPlayers().filter((p) => p.status === "accepted");

    if (acceptedPlayers.length < 2) {
      return NextResponse.json(
        { message: "Se necesitan al menos 2 jugadores aceptados para generar el bracket." },
        { status: 400 }
      );
    }

    const bracket = generateBracket(acceptedPlayers);
    tournament.bracket = bracket;
    tournament.status = "active";
    saveTournament(tournament);

    return NextResponse.json({ bracket });
  }

  if (action === "reset_bracket") {
    tournament.bracket = null;
    tournament.status = "registration";
    saveTournament(tournament);
    return NextResponse.json({ message: "Bracket reseteado" });
  }

  // Update config
  if (tournamentDate !== undefined) tournament.tournamentDate = tournamentDate;
  if (maxPlayers !== undefined) tournament.maxPlayers = Number(maxPlayers);
  if (status !== undefined) tournament.status = status;

  saveTournament(tournament);
  return NextResponse.json({ tournament });
}
