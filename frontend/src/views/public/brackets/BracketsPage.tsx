"use client";

import { TrophyIcon, BoltIcon } from "@heroicons/react/24/outline";
import { FireIcon, StarIcon } from "@heroicons/react/24/solid";
import { Chip, Typography } from "@material-tailwind/react";
import { useEffect, useState, useCallback } from "react";
import MatchModal from "@/src/components/MatchModal";
import type { CardItem } from "@/src/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchPlayer {
  id: string;
  name: string;
  tag: string;
  trophies: number;
}

interface Match {
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

interface Round {
  label: string;
  key: string;
  matches: Match[];
}

interface Tournament {
  tournamentDate: string;
  maxPlayers: number;
  status: string;
  bracket: {
    rounds: Round[];
  } | null;
  acceptedCount: number;
  pendingCount: number;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PlayerAvatar({ name }: { name: string; trophies: number }) {
  const initials = name.substring(0, 2).toUpperCase();
  return (
    <div
      className="w-7 h-7 rounded-full bg-linear-to-br from-secondary to-tertiary flex items-center justify-center font-extrabold text-white text-xs shrink-0 shadow-md"
    >
      {initials}
    </div>
  );
}

function MatchCard({
  match,
  round,
  onClick,
}: {
  match: Match;
  round: string;
  onClick?: () => void;
}) {
  const p1Won = Boolean(match.winner && match.player1 && match.winner === match.player1.id);
  const p2Won = Boolean(match.winner && match.player2 && match.winner === match.player2.id);
  const played = !!match.winner;

  const rowClass = (won: boolean | null, tbd: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
      tbd
        ? "opacity-40"
        : won
        ? "bg-secondary/20 border border-secondary/40"
        : played
        ? "opacity-50"
        : "border border-white/5 bg-white/3"
    }`;

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-1 rounded-xl border border-white/10 bg-primary/80 p-2 min-w-[200px] max-w-[220px] shadow-lg shadow-black/30 hover:border-secondary/50 hover:scale-[1.02] transition-all cursor-pointer group"
      style={{ backdropFilter: "blur(6px)" }}
    >
      {/* Label & Badges */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-semibold text-neutral/50 uppercase tracking-widest">
          {round}
        </span>
        {match.autoValidated ? (
          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            ⚡ Auto
          </span>
        ) : match.player1 && match.player2 ? (
          <span className="text-[9px] text-neutral/40 group-hover:text-secondary transition-colors">
            Ver mazos ➔
          </span>
        ) : null}
      </div>

      {/* Player 1 */}
      <div className={rowClass(p1Won, !match.player1)}>
        {match.player1 ? (
          <>
            <PlayerAvatar name={match.player1.name} trophies={match.player1.trophies} />
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-bold truncate ${p1Won ? "text-white" : "text-neutral"}`}>
                {match.player1.name}
              </span>
              <span className="text-[10px] text-neutral/50">{match.player1.tag}</span>
            </div>
            {match.score1 !== null && (
              <span className={`ml-auto text-sm font-extrabold ${p1Won ? "text-secondary" : "text-neutral/40"}`}>
                {match.score1}
              </span>
            )}
            {p1Won && <StarIcon className="size-3 text-secondary shrink-0" />}
          </>
        ) : (
          <span className="text-xs text-neutral/30 italic">Por definir</span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5 mx-2" />

      {/* Player 2 */}
      <div className={rowClass(p2Won, !match.player2)}>
        {match.player2 ? (
          <>
            <PlayerAvatar name={match.player2.name} trophies={match.player2.trophies} />
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-bold truncate ${p2Won ? "text-white" : "text-neutral"}`}>
                {match.player2.name}
              </span>
              <span className="text-[10px] text-neutral/50">{match.player2.tag}</span>
            </div>
            {match.score2 !== null && (
              <span className={`ml-auto text-sm font-extrabold ${p2Won ? "text-secondary" : "text-neutral/40"}`}>
                {match.score2}
              </span>
            )}
            {p2Won && <StarIcon className="size-3 text-secondary shrink-0" />}
          </>
        ) : (
          <span className="text-xs text-neutral/30 italic">Por definir</span>
        )}
      </div>
    </div>
  );
}

// Columna de ronda
function RoundColumn({
  label,
  matches,
  roundKey,
  onSelectMatch,
}: {
  label: string;
  matches: Match[];
  roundKey: string;
  onSelectMatch: (m: Match, label: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Round badge */}
      <div className="mb-3 px-4 py-1 rounded-full border border-tertiary/40 bg-tertiary/10">
        <span className="text-xs font-extrabold text-tertiary uppercase tracking-wider">{label}</span>
      </div>
      {/* Matches evenly spaced */}
      <div className="flex flex-col justify-around flex-1 gap-6">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            round={roundKey}
            onClick={() => onSelectMatch(m, label)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BracketsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{
    match: Match;
    roundLabel: string;
  } | null>(null);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch("/api/tournament");
      const data = await res.json();
      setTournament(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const syncBattles = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/tournament/sync-battles", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.bracket) {
        setTournament((prev) =>
          prev ? { ...prev, bracket: data.bracket } : prev
        );
      }
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchTournament();

    // Auto-sync battles every 15 seconds, but only when a bracket is active
    const interval = setInterval(() => {
      setTournament((prev) => {
        if (prev?.bracket) {
          syncBattles();
        }
        return prev;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTournament, syncBattles]);

  const rounds = tournament?.bracket?.rounds ?? [];

  let totalMatches = 0;
  let completedMatches = 0;

  rounds.forEach((r) => {
    totalMatches += r.matches.length;
    completedMatches += r.matches.filter((m) => m.winner).length;
  });

  const progress =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  // Final winner determination
  const finalRound = rounds.find((r) => r.key === "final");
  const finalMatch = finalRound?.matches[0];
  const champion = finalMatch?.winner
    ? finalMatch.winner === finalMatch.player1?.id
      ? finalMatch.player1
      : finalMatch.player2
    : null;

  return (
    <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 font-sans">
      <div className="w-full py-15 md:py-20 px-6 md:px-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold animate-pulse">
                <span className="size-2 rounded-full bg-red-500 animate-ping" />
                <span>En Vivo (Auto-sync 15s)</span>
              </div>
              <FireIcon className="size-5 text-tertiary" />
            </div>
            <Typography
              variant="h1"
              className="md:text-5xl bg-linear-to-t from-secondary bg-clip-text text-transparent to-white font-extrabold leading-tight tracking-tight mb-1"
            >
              Cuadro del Torneo
            </Typography>
            <Typography
              variant="h6"
              className="text-white font-bold md:text-base flex items-center gap-2"
            >
              Haz clic en cualquier partido para ver el **mazo de cartas** y el detalle del resultado.
            </Typography>
          </div>

          {/* Progress & Live Sync button */}
          <div
            className="rounded-xl border border-secondary/30 bg-primary/80 p-5 min-w-[240px] flex flex-col gap-3"
            style={{ boxShadow: "0px 0px 20px -8px var(--secondary)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrophyIcon className="size-5 text-secondary" />
                <span className="text-sm font-bold text-white">Progreso</span>
              </div>
              <button
                onClick={syncBattles}
                disabled={syncing}
                className="p-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                title="Sincronizar batallas ahora"
              >
                <BoltIcon
                  className={`size-4 ${syncing ? "animate-spin" : ""}`}
                />
                Sync
              </button>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-neutral">
                  {completedMatches}/{totalMatches} partidos
                </span>
                <span className="text-xs font-bold text-secondary">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-linear-to-r from-secondary to-tertiary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Chip
                variant="ghost"
                size="sm"
                value={`Aceptados: ${tournament?.acceptedCount ?? 0}`}
                className="text-tertiary border-tertiary/30 text-xs"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral">
            <div className="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-secondary rounded-full mb-2" />
            <p>Cargando cuadro del torneo...</p>
          </div>
        ) : !tournament?.bracket ? (
          <div className="bg-primary/60 border border-white/10 text-neutral p-12 rounded-xl text-center my-6">
            <Typography variant="h5" className="text-white font-bold mb-2">
              El cuadro aún no ha sido generado
            </Typography>
            <Typography variant="small">
              El torneo está en fase de registros. Tan pronto como el administrador
              genere las llaves, el cuadro aparecerá aquí.
            </Typography>
          </div>
        ) : (
          /* Bracket — scrollable horizontally on small screens */
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-8 items-stretch min-w-max">
              {rounds.map((rd) => (
                <div key={rd.key} className="flex gap-8 items-stretch">
                  <RoundColumn
                    label={rd.label}
                    matches={rd.matches}
                    roundKey={rd.key.toUpperCase()}
                    onSelectMatch={(m, label) =>
                      setSelectedMatch({ match: m, roundLabel: label })
                    }
                  />

                  {/* Connector line */}
                  <div className="flex items-center">
                    <div className="w-8 border-t border-dashed border-secondary/20" />
                  </div>
                </div>
              ))}

              {/* Campeón */}
              <div className="flex items-center gap-4">
                <div
                  className="flex flex-col items-center justify-center rounded-2xl border border-tertiary/40 bg-tertiary/10 p-6 min-w-[160px] gap-3"
                  style={{ boxShadow: "0px 0px 30px -8px var(--tertiary)" }}
                >
                  <TrophyIcon className="size-10 text-tertiary" />
                  <Typography
                    variant="h6"
                    className="text-white font-extrabold text-center"
                  >
                    Campeón
                  </Typography>
                  {champion ? (
                    <div className="text-center">
                      <span className="text-sm font-extrabold text-secondary block">
                        {champion.name}
                      </span>
                      <span className="text-xs text-neutral">
                        {champion.tag}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral/60 italic text-center">
                      Por definir
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4 items-center">
          <span className="text-xs text-neutral/50 font-semibold uppercase tracking-wider">
            Leyenda:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-center">
              ⚡
            </div>
            <span className="text-xs text-neutral/70">Autovalidado por API</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-secondary/20 border border-secondary/40" />
            <span className="text-xs text-neutral/70">Ganador</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-white/10 bg-white/3" />
            <span className="text-xs text-neutral/70">Por jugar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StarIcon className="size-3 text-secondary" />
            <span className="text-xs text-neutral/70">Clasificó</span>
          </div>
        </div>

        {/* Match Details Modal */}
        <MatchModal
          match={selectedMatch?.match ?? null}
          roundLabel={selectedMatch?.roundLabel ?? ""}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSync={async () => {
            await syncBattles();
            fetchTournament();
          }}
          isSyncing={syncing}
        />
      </div>
    </div>
  );
}
