import fs from "fs";
import path from "path";

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

export interface Match {
  id: string;
  round: string;
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  winner: string | null; // player id
  score1: number | null;
  score2: number | null;
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

// ─── Players ─────────────────────────────────────────────────────────────────

export function getPlayers(): Player[] {
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

export function savePlayers(players: Player[]): void {
  ensureDataDir();
  fs.writeFileSync(
    PLAYERS_FILE,
    JSON.stringify({ players, lastUpdated: new Date().toISOString() }, null, 2)
  );
}

export function getPlayerById(id: string): Player | null {
  return getPlayers().find((p) => p.id === id) ?? null;
}

export function getPlayerByTag(tag: string): Player | null {
  const normalizedTag = tag.startsWith("#") ? tag : `#${tag}`;
  return (
    getPlayers().find(
      (p) => p.tag.toUpperCase() === normalizedTag.toUpperCase()
    ) ?? null
  );
}

export function upsertPlayer(player: Player): void {
  const players = getPlayers();
  const idx = players.findIndex((p) => p.id === player.id);
  if (idx >= 0) {
    players[idx] = player;
  } else {
    players.push(player);
  }
  savePlayers(players);
}

export function deletePlayer(id: string): boolean {
  const players = getPlayers();
  const filtered = players.filter((p) => p.id !== id);
  if (filtered.length === players.length) return false;
  savePlayers(filtered);
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

export function getTournament(): Tournament {
  ensureDataDir();
  if (!fs.existsSync(TOURNAMENT_FILE)) return DEFAULT_TOURNAMENT;
  try {
    const raw = fs.readFileSync(TOURNAMENT_FILE, "utf-8");
    return { ...DEFAULT_TOURNAMENT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TOURNAMENT;
  }
}

export function saveTournament(tournament: Tournament): void {
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
