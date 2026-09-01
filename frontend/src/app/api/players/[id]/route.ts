import { NextRequest, NextResponse } from "next/server";
import { getPlayerById, upsertPlayer, deletePlayer } from "@/src/lib/db";
import type { PlayerStatus } from "@/src/lib/db";

// PATCH /api/players/[id]  — update player status or wins/losses
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const player = getPlayerById(id);

  if (!player) {
    return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { status, wins, losses } = body;

  if (status !== undefined) {
    const validStatuses: PlayerStatus[] = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }
    player.status = status;
  }

  if (wins !== undefined) player.wins = Number(wins);
  if (losses !== undefined) player.losses = Number(losses);

  upsertPlayer(player);
  return NextResponse.json({ player });
}

// DELETE /api/players/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deletePlayer(id);

  if (!deleted) {
    return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ message: "Jugador eliminado correctamente" });
}
