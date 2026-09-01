import { NextRequest, NextResponse } from "next/server";
import { getPlayers, getPlayerByTag, upsertPlayer, getTournament } from "@/src/lib/db";
import type { Player, PlayerStatus } from "@/src/lib/db";
import crypto from "crypto";

// GET /api/players?status=pending|accepted|rejected|all
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") as PlayerStatus | "all" | null;
  const isAdmin =
    req.headers.get("x-admin-auth") === "true" ||
    req.nextUrl.searchParams.get("admin") === "true";

  let players = getPlayers();

  if (status && status !== "all") {
    players = players.filter((p) => p.status === status);
  }

  // Sort by trophies descending for public view
  players = players.sort((a, b) => b.trophies - a.trophies);

  // Mask contact info if not admin
  if (!isAdmin) {
    players = players.map((p) => ({
      ...p,
      contact: "🔒 Oculto",
    }));
  }

  return NextResponse.json({ players });
}

// POST /api/players  — register a new player
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tag, name, trophies, bestTrophies, expLevel, clan, arena, contact } = body;

    if (!tag || !name || !contact) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios: tag, name, contact" },
        { status: 400 }
      );
    }

    // Check for duplicate tag
    const existing = getPlayerByTag(tag);
    if (existing) {
      return NextResponse.json(
        { message: "Este tag ya está registrado en el torneo." },
        { status: 409 }
      );
    }

    // Check max players
    const tournament = getTournament();
    const acceptedCount = getPlayers().filter((p) => p.status === "accepted").length;
    const pendingCount = getPlayers().filter((p) => p.status === "pending").length;

    if (acceptedCount + pendingCount >= tournament.maxPlayers) {
      return NextResponse.json(
        { message: "El torneo ya está lleno. No se aceptan más registros." },
        { status: 409 }
      );
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      tag: tag.startsWith("#") ? tag : `#${tag}`,
      name,
      trophies: Number(trophies) || 0,
      bestTrophies: Number(bestTrophies) || 0,
      expLevel: Number(expLevel) || 0,
      clan: clan ?? null,
      arena: arena ?? null,
      contact,
      status: "pending",
      registeredAt: new Date().toISOString(),
      wins: 0,
      losses: 0,
    };

    upsertPlayer(newPlayer);

    return NextResponse.json({ player: newPlayer }, { status: 201 });
  } catch (err) {
    console.error("POST /api/players error:", err);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
