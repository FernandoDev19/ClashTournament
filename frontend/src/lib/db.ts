import fs from "fs";
import path from "path";
import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlayerStatus = "pending" | "accepted" | "rejected";

export interface Player {
  id: string;
  tag: string;
  name: string;
  trophies: number;
  bestTrophies: number;
  expLevel: number;
  clan: { name: string; tag: string } | null;
  arena: string | null;
  contact: string;
  status: PlayerStatus;
  registeredAt: string;
  wins: number;
  losses: number;
}

export type TournamentStatus = "registration" | "active" | "finished";

export interface MatchPlayer {
  id: string;
  name: string;
  tag: string;
  trophies: number;
}

export interface CardItem {
  name: string;
  level: number;
  maxLevel: number;
  iconUrl: string;
}

export interface Match {
  id: string;
  round: string;
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  winner: string | null; // player id
  score1: number | null;
  score2: number | null;
  deck1?: CardItem[] | null;
  deck2?: CardItem[] | null;
  battleTime?: string | null;
  autoValidated?: boolean;
}

export interface Tournament {
  tournamentDate: string;
  maxPlayers: number;
  status: TournamentStatus;
  bracket: {
    rounds: {
      label: string;
      key: string;
      matches: Match[];
    }[];
  } | null;
  lastUpdated: string;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const PLAYERS_FILE = path.join(DATA_DIR, "players.json");
const TOURNAMENT_FILE = path.join(DATA_DIR, "tournament.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabasePlayer(row: any): Player {
  return {
    id: row.id,
    tag: row.tag,
    name: row.name,
    trophies: Number(row.trophies) || 0,
    bestTrophies: Number(row.bestTrophies ?? row.best_trophies ?? row.besttrophies) || 0,
    expLevel: Number(row.expLevel ?? row.exp_level ?? row.explevel) || 1,
    clan: row.clan ?? null,
    arena: row.arena ?? null,
    contact: row.contact ?? "",
    status: row.status ?? "pending",
    registeredAt: row.registeredAt ?? row.registered_at ?? row.registeredat ?? new Date().toISOString(),
    wins: Number(row.wins) || 0,
    losses: Number(row.losses) || 0,
  };
}

function mapPlayerToSupabase(p: Player) {
  return {
    id: p.id,
    tag: p.tag,
    name: p.name,
    trophies: p.trophies,
    besttrophies: p.bestTrophies,
    explevel: p.expLevel,
    clan: p.clan,
    arena: p.arena,
    contact: p.contact,
    status: p.status,
    registeredat: p.registeredAt,
    wins: p.wins,
    losses: p.losses,
  };
}

// ─── Players ─────────────────────────────────────────────────────────────────

export async function getPlayers(): Promise<Player[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("players").select("*");
      if (error) {
        console.error("[Supabase] getPlayers error:", JSON.stringify(error));
      } else if (data) {
        return data.map(mapSupabasePlayer);
      }
    } catch (e) {
      console.error("[Supabase] getPlayers exception:", e);
    }
  }

  ensureDataDir();
  if (!fs.existsSync(PLAYERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(PLAYERS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return data.players ?? [];
  } catch {
    return [];
  }
}

export async function savePlayers(players: Player[]): Promise<void> {
  if (supabase) {
    try {
      const rows = players.map(mapPlayerToSupabase);
      const { error } = await supabase.from("players").upsert(rows, { onConflict: "id" });
      if (error) {
        console.error("[Supabase] savePlayers error:", JSON.stringify(error));
      } else {
        return;
      }
    } catch (e) {
      console.error("[Supabase] savePlayers exception:", e);
    }
  }

  ensureDataDir();
  fs.writeFileSync(
    PLAYERS_FILE,
    JSON.stringify({ players, lastUpdated: new Date().toISOString() }, null, 2)
  );
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const players = await getPlayers();
  return players.find((p) => p.id === id) ?? null;
}

export async function getPlayerByTag(tag: string): Promise<Player | null> {
  const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
  const players = await getPlayers();
  return (
    players.find(
      (p) => p.tag.toUpperCase() === normalizedTag.toUpperCase()
    ) ?? null
  );
}

export async function upsertPlayer(player: Player): Promise<void> {
  if (supabase) {
    try {
      const row = mapPlayerToSupabase(player);
      let { error } = await supabase.from("players").upsert(row, { onConflict: "id" });
      
      // If error is PGRST204 (column missing in DB schema), retry with basic fields
      if (error && error.code === "PGRST204") {
        const basicRow = {
          id: player.id,
          tag: player.tag,
          name: player.name,
          trophies: player.trophies,
          clan: player.clan,
          arena: player.arena,
          contact: player.contact,
          status: player.status,
          wins: player.wins,
          losses: player.losses,
        };
        const retry = await supabase.from("players").upsert(basicRow, { onConflict: "id" });
        error = retry.error;
      }

      if (error) {
        console.error("[Supabase] upsertPlayer error:", JSON.stringify(error));
      } else {
        console.log("[Supabase] upsertPlayer success:", player.id);
        return;
      }
    } catch (e) {
      console.error("[Supabase] upsertPlayer exception:", e);
    }
  }

  const players = await getPlayers();
  const idx = players.findIndex((p) => p.id === player.id);
  if (idx >= 0) {
    players[idx] = player;
  } else {
    players.push(player);
  }
  await savePlayers(players);
}

export async function deletePlayer(id: string): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) {
        console.error("[Supabase] deletePlayer error:", JSON.stringify(error));
      } else {
        return true;
      }
    } catch (e) {
      console.error("[Supabase] deletePlayer exception:", e);
    }
  }

  const players = await getPlayers();
  const filtered = players.filter((p) => p.id !== id);
  if (filtered.length === players.length) return false;
  await savePlayers(filtered);
  return true;
}

// ─── Tournament ───────────────────────────────────────────────────────────────

const DEFAULT_TOURNAMENT: Tournament = {
  tournamentDate: "",
  maxPlayers: 16,
  status: "registration",
  bracket: null,
  lastUpdated: "",
};

export async function getTournament(): Promise<Tournament> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tournament")
        .select("*")
        .eq("id", "current")
        .single();
      if (!error && data) {
        return {
          tournamentDate: data.tournamentdate ?? data.tournamentDate ?? data.tournament_date ?? "",
          maxPlayers: Number(data.maxplayers ?? data.maxPlayers ?? data.max_players) || 16,
          status: data.status ?? "registration",
          bracket: data.bracket ?? null,
          lastUpdated: data.lastupdated ?? data.lastUpdated ?? data.last_updated ?? "",
        };
      }
    } catch {
      // fallback
    }
  }

  ensureDataDir();
  if (!fs.existsSync(TOURNAMENT_FILE)) return DEFAULT_TOURNAMENT;
  try {
    const raw = fs.readFileSync(TOURNAMENT_FILE, "utf-8");
    return { ...DEFAULT_TOURNAMENT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TOURNAMENT;
  }
}

export async function saveTournament(tournament: Tournament): Promise<void> {
  if (supabase) {
    try {
      const record = {
        id: "current",
        tournamentdate: tournament.tournamentDate,
        maxplayers: tournament.maxPlayers,
        status: tournament.status,
        bracket: tournament.bracket,
        lastupdated: new Date().toISOString(),
      };
      const { error } = await supabase.from("tournament").upsert(record, { onConflict: "id" });
      if (!error) return;
      console.error("[Supabase] saveTournament error:", JSON.stringify(error));
    } catch (e) {
      console.error("[Supabase] saveTournament exception:", e);
    }
  }

  ensureDataDir();
  fs.writeFileSync(
    TOURNAMENT_FILE,
    JSON.stringify(
      { ...tournament, lastUpdated: new Date().toISOString() },
      null,
      2
    )
  );
}

// ─── Bracket Generation ───────────────────────────────────────────────────────

/**
 * Generates a single-elimination bracket from accepted players.
 * Players are seeded by trophies (highest first).
 */
export function generateBracket(players: Player[]): Tournament["bracket"] {
  // Sort by trophies descending
  const seeded = [...players].sort((a, b) => b.trophies - a.trophies);
  const count = seeded.length;

  if (count < 2) return null;

  // Find the nearest power of 2 >= count
  const slots = Math.pow(2, Math.ceil(Math.log2(count)));

  // Build R1 matchups with byes if count is not a power of 2
  const r1Matches: Match[] = [];
  const byes: MatchPlayer[] = [];

  for (let i = 0; i < slots / 2; i++) {
    const top = seeded[i] ?? null;
    const bottom = seeded[slots - 1 - i] ?? null;

    if (!top) continue;

    if (!bottom) {
      // top gets a bye
      byes.push(toMatchPlayer(top));
      continue;
    }

    r1Matches.push({
      id: `r1-${i + 1}`,
      round: "R1",
      player1: toMatchPlayer(top),
      player2: toMatchPlayer(bottom),
      winner: null,
      score1: null,
      score2: null,
    });
  }

  // Build subsequent rounds as empty placeholders
  const rounds: Tournament["bracket"] extends null
    ? never
    : NonNullable<Tournament["bracket"]>["rounds"] = [];

  const firstRoundLabel =
    slots === 16
      ? "16avos"
      : slots === 8
      ? "Cuartos"
      : slots === 4
      ? "Semis"
      : "Ronda 1";

  rounds.push({ label: firstRoundLabel, key: "r1", matches: r1Matches });

  // Generate empty placeholder rounds
  const roundDefs = [
    { label: "Cuartos", key: "qf" },
    { label: "Semis", key: "sf" },
    { label: "Final", key: "final" },
  ];

  let prevMatchCount = r1Matches.length + byes.length;

  for (const rd of roundDefs) {
    prevMatchCount = Math.ceil(prevMatchCount / 2);
    if (prevMatchCount < 1) break;

    const matches: Match[] = Array.from({ length: prevMatchCount }, (_, i) => ({
      id: `${rd.key}-${i + 1}`,
      round: rd.key.toUpperCase(),
      player1: byes[i * 2] ?? null,
      player2: byes[i * 2 + 1] ?? null,
      winner: null,
      score1: null,
      score2: null,
    }));

    rounds.push({ label: rd.label, key: rd.key, matches });
    byes.length = 0; // clear byes after placing in next round
  }

  return { rounds };
}

function toMatchPlayer(player: Player): MatchPlayer {
  return {
    id: player.id,
    name: player.name,
    tag: player.tag,
    trophies: player.trophies,
  };
}
