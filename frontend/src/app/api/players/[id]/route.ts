import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPlayerById, upsertPlayer, deletePlayer } from "@/src/lib/db";

const patchSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
  wins: z.number().int().min(0).optional(),
  losses: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const player = await getPlayerById(id);
  if (!player) {
    return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
  }

  const { status, wins, losses } = parsed.data;
  if (status !== undefined) player.status = status;
  if (wins !== undefined) player.wins = wins;
  if (losses !== undefined) player.losses = losses;

  await upsertPlayer(player);
  return NextResponse.json({ player });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deletePlayer(id);
  if (!deleted) {
    return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ message: "Jugador eliminado correctamente" });
}