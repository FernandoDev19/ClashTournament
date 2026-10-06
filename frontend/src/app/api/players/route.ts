import { NextRequest, NextResponse } from "next/server";
import { getPlayers, getPlayerByTag, upsertPlayer, getTournament } from "@/src/lib/db";
import type { Player, PlayerStatus } from "@/src/lib/db";
import crypto from "crypto";
import { isAdminRequest } from "@/src/lib/auth";
import { crFetch, normalizeTag, TAG_REGEX } from "@/src/lib/clash";

// GET /api/players?status=pending|accepted|rejected|all
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") as PlayerStatus | "all" | null;
  const isAdmin = isAdminRequest(req);

  let players = await getPlayers();

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
    const { tag, contact } = body;


    if (!tag || !contact) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios: tag, contact" },
        { status: 400 }
      );
    }

    // Validate tag format
    if (!TAG_REGEX.test(tag)) {
      return NextResponse.json(
        { message: "Tag de Clash Royale inválido" },
        { status: 400 }
      );
    }

    // Validate contact length
    if (contact.length >= 100) {
      return NextResponse.json(
        { message: "El contacto es muy largo, no puede exceder los 100 caracteres" },
        { status: 400 }
      );
    }

    // Check for duplicate tag
    const existing = await getPlayerByTag(tag);
    if (existing) {
      return NextResponse.json(
        { message: "Este tag ya está registrado en el torneo." },
        { status: 409 }
      );
    }

    // Check max players
    const tournament = await getTournament();
    const allPlayers = await getPlayers();
    const acceptedCount = allPlayers.filter((p) => p.status === "accepted").length;
    const pendingCount = allPlayers.filter((p) => p.status === "pending").length;

    if (tournament.status !== "registration") {
      return NextResponse.json(
        { message: "El torneo no está abierto para registros" },
        { status: 403 }
      );
    }

    if (acceptedCount + pendingCount >= tournament.maxPlayers) {
      return NextResponse.json(
        { message: "El torneo ya está lleno. No se aceptan más registros." },
        { status: 409 }
      );
    }

    const res = await crFetch("/players/" + encodeURIComponent(normalizeTag(tag)))

    if (!res.ok) {
      return NextResponse.json(
        { message: res.message },
        { status: res.status }
      );
    }

    const { name, trophies, bestTrophies, expLevel, clan, arena } = res.data as Player;

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

    await upsertPlayer(newPlayer);

    return NextResponse.json({ player: newPlayer }, { status: 201 });
  } catch (err) {
    console.error("POST /api/players error:", err);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
