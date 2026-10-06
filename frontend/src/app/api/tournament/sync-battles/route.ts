import { NextRequest, NextResponse } from "next/server";
import { getTournament, saveTournament } from "@/src/lib/db";
import type { CardItem, Match } from "@/src/lib/db";
import { propagateWinner } from "@/src/lib/bracket";

const CR_API_TOKEN = process.env.CR_API_TOKEN ?? "";

// Tipos de batalla que cuentan para el torneo. Revisa tu battlelog real y ajusta.
const VALID_TYPES = new Set(["friendly"]);

/* eslint-disable @typescript-eslint/no-explicit-any */
type Battlelog = any[];

async function fetchPlayerBattlelog(tag: string): Promise<Battlelog> {
  if (!CR_API_TOKEN) return [];
  const normalized = tag.startsWith("#") ? tag : `#${tag}`;
  const url = `https://proxy.royaleapi.dev/v1/players/${encodeURIComponent(normalized)}/battlelog`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CR_API_TOKEN}` },
      cache: "no-store",
    });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

// "20260914T202518.000Z" -> Date
function parseCRBattleTime(s: string): Date | null {
  if (!s) return null;
  if (s.length >= 15 && !s.includes("-")) {
    const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13)}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const mapCards = (cards: any[] = []): CardItem[] =>
  cards.map((c) => ({
    name: c.name,
    level: c.level,
    maxLevel: c.maxLevel,
    iconUrl: c.iconUrls?.medium || c.iconUrls?.evoMedium || "",
  }));

async function syncSingleMatch(
  match: Match,
  minTimestamp: number | null,
  getLog: (tag: string) => Promise<Battlelog>
): Promise<boolean> {
  if (!match.player1 || !match.player2) return false;

  const tag1 = match.player1.tag.toUpperCase();
  const tag2 = match.player2.tag.toUpperCase();
  const battles = await getLog(tag1);

  const matchBattles = battles.filter((b) => {
    if (!VALID_TYPES.has(b.type)) return false;

    const t = b.team?.[0]?.tag?.toUpperCase();
    const o = b.opponent?.[0]?.tag?.toUpperCase();
    if (!((t === tag1 && o === tag2) || (t === tag2 && o === tag1))) return false;

    if (minTimestamp && b.battleTime) {
      const d = parseCRBattleTime(b.battleTime);
      if (d && d.getTime() < minTimestamp) return false;
    }
    return true;
  });

  if (matchBattles.length === 0) return false;

  // La API devuelve de más reciente a más antigua: invertimos para contar la serie en orden
  let wins1 = 0;
  let wins2 = 0;
  for (const b of [...matchBattles].reverse()) {
    if (wins1 >= 2 || wins2 >= 2) break;
    const p1IsTeam = b.team?.[0]?.tag?.toUpperCase() === tag1;
    const c1 = (p1IsTeam ? b.team : b.opponent)?.[0]?.crowns ?? 0;
    const c2 = (p1IsTeam ? b.opponent : b.team)?.[0]?.crowns ?? 0;
    if (c1 > c2) wins1++;
    else if (c2 > c1) wins2++;
  }

  const winnerId =
    wins1 >= 2 ? match.player1.id : wins2 >= 2 ? match.player2.id : null;

  const last = matchBattles[0];
  const p1IsTeam = last.team?.[0]?.tag?.toUpperCase() === tag1;
  const p1Data = (p1IsTeam ? last.team : last.opponent)?.[0];
  const p2Data = (p1IsTeam ? last.opponent : last.team)?.[0];

  if (match.score1 === wins1 && match.score2 === wins2 && match.winner === winnerId) {
    return false;
  }

  match.score1 = wins1;
  match.score2 = wins2;
  match.winner = winnerId;
  match.deck1 = mapCards(p1Data?.cards);
  match.deck2 = mapCards(p2Data?.cards);
  match.battleTime = last.battleTime;
  match.autoValidated = true;
  return true;
}

async function runSync() {
  const tournament = await getTournament();
  const bracket = tournament.bracket;
  if (!bracket) {
    return { status: 400, body: { message: "No hay bracket activo para sincronizar" } };
  }

  const dateStr = bracket.createdAt ?? tournament.tournamentDate;
  const parsed = dateStr ? new Date(dateStr).getTime() : NaN;
  const minTimestamp = isNaN(parsed) ? null : parsed;

  // Un solo fetch por jugador durante todo el sync
  const cache = new Map<string, Promise<Battlelog>>();
  const getLog = (tag: string) => {
    const key = tag.toUpperCase();
    if (!cache.has(key)) cache.set(key, fetchPlayerBattlelog(key));
    return cache.get(key)!;
  };

  let updatedCount = 0;
  const syncedMatches: string[] = [];

  for (let rIdx = 0; rIdx < bracket.rounds.length; rIdx++) {
    const matches = bracket.rounds[rIdx].matches;
    for (let mIdx = 0; mIdx < matches.length; mIdx++) {
      const m = matches[mIdx];
      if (!(await syncSingleMatch(m, minTimestamp, getLog))) continue;

      updatedCount++;
      if (m.winner && m.player1 && m.player2) {
        syncedMatches.push(`${m.player1.name} (${m.score1}) vs ${m.player2.name} (${m.score2})`);
      }
      propagateWinner(bracket, rIdx, mIdx);
    }
  }

  const tp = bracket.thirdPlaceMatch;
  if (tp && (await syncSingleMatch(tp, minTimestamp, getLog))) {
    updatedCount++;
    if (tp.winner && tp.player1 && tp.player2) {
      syncedMatches.push(`🥉 ${tp.player1.name} (${tp.score1}) vs ${tp.player2.name} (${tp.score2})`);
    }
  }

  if (updatedCount > 0) await saveTournament(tournament);

  return {
    status: 200,
    body: {
      message: updatedCount > 0 ? `${updatedCount} partida(s) sincronizada(s)` : "No se detectaron nuevas partidas en la API",
      updatedCount,
      syncedMatches,
      bracket,
    },
  };
}

// POST: botón del admin (protegido por proxy.ts)
export async function POST() {
  const r = await runSync();
  return NextResponse.json(r.body, { status: r.status });
}

// GET: para cron (Vercel Cron manda Authorization: Bearer <CRON_SECRET>)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const r = await runSync();
  return NextResponse.json(r.body, { status: r.status });
}