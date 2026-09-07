"use client";

import { XMarkIcon, BoltIcon, TrophyIcon, StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import type { Match, CardItem } from "@/src/lib/db";

interface MatchModalProps {
  match: Match | null;
  roundLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

function DeckGrid({ cards, playerName }: { cards?: CardItem[] | null; playerName: string }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 text-center text-xs text-neutral/50 italic">
        Sin mazo registrado aún para {playerName}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-neutral block">
        Mazo utilizado por <span className="text-white font-extrabold">{playerName}</span>:
      </span>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-slate-900/80 border border-white/10 p-3 rounded-xl">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center bg-primary/90 border border-white/10 rounded-lg p-1 hover:border-secondary transition-all"
            title={`${card.name} (Nivel ${card.level})`}
          >
            {card.iconUrl ? (
              <div className="relative size-12 sm:size-14">
                <Image
                  src={card.iconUrl}
                  alt={card.name}
                  fill
                  className="object-contain"
                  sizes="56px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="size-12 sm:size-14 bg-slate-800 rounded flex items-center justify-center text-[10px] text-neutral">
                🎴
              </div>
            )}
            <span className="text-[10px] font-bold text-white truncate max-w-full mt-0.5">
              {card.name}
            </span>
            <span className="text-[9px] text-tertiary font-extrabold">
              Niv. {card.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MatchModal({
  match,
  roundLabel,
  isOpen,
  onClose,
  onSync,
  isSyncing,
}: MatchModalProps) {
  if (!isOpen || !match) return null;

  const p1 = match.player1;
  const p2 = match.player2;

  const p1Won = Boolean(match.winner && p1 && match.winner === p1.id);
  const p2Won = Boolean(match.winner && p2 && match.winner === p2.id);

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-2xl bg-primary border border-secondary/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0px 0px 30px -5px var(--secondary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-secondary/10">
          <div className="flex items-center gap-2">
            <TrophyIcon className="size-5 text-secondary" />
            <span className="text-sm font-extrabold text-white uppercase tracking-wider">
              {roundLabel} · Detalle de Enfrentamiento
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XMarkIcon className="size-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Status Badge */}
          <div className="flex justify-between items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              {match.autoValidated ? (
                <>
                  <BoltIcon className="size-4 text-amber-400 animate-pulse" />
                  <span className="font-bold text-amber-300">
                    ⚡ Autovalidado API (Al mejor de 3)
                  </span>
                </>
              ) : (
                <span className="text-neutral/70">
                  {match.winner
                    ? "Ganador definido (Bo3 completado)"
                    : match.score1 !== null || match.score2 !== null
                    ? "Serie en curso (Bo3)"
                    : "Partida pendiente por disputar"}
                </span>
              )}
            </div>

            {match.battleTime && (
              <span className="text-neutral/50 text-[11px]">
                {new Date(match.battleTime).toLocaleString()}
              </span>
            )}
          </div>

          {/* Versus Display */}
          <div className="grid grid-cols-7 items-center gap-2 bg-slate-950/60 border border-white/10 rounded-2xl p-4">
            {/* Player 1 */}
            <div className={`col-span-3 flex flex-col items-center text-center p-3 rounded-xl ${p1Won ? "bg-secondary/20 border border-secondary/40" : ""}`}>
              <div className="size-12 rounded-full bg-linear-to-br from-secondary to-tertiary flex items-center justify-center font-black text-white text-lg shadow-md mb-2">
                {p1?.name ? p1.name.substring(0, 2).toUpperCase() : "?"}
              </div>
              <span className="font-extrabold text-white text-sm sm:text-base truncate max-w-full">
                {p1?.name ?? "Por definir"}
              </span>
              <span className="text-xs font-mono text-secondary">{p1?.tag ?? "-"}</span>
              <span className="text-xs text-tertiary font-bold mt-1">
                🏆 {p1?.trophies?.toLocaleString() ?? 0}
              </span>
              <div className="mt-3 flex items-center gap-1">
                <span className="text-3xl font-black text-white">
                  {match.score1 !== null ? match.score1 : "-"}
                </span>
                <span className="text-xl">👑</span>
                {p1Won && <StarIcon className="size-5 text-secondary ml-1" />}
              </div>
            </div>

            {/* VS */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="text-xl font-black italic bg-linear-to-t from-secondary to-tertiary bg-clip-text text-transparent">
                VS
              </span>
            </div>

            {/* Player 2 */}
            <div className={`col-span-3 flex flex-col items-center text-center p-3 rounded-xl ${p2Won ? "bg-secondary/20 border border-secondary/40" : ""}`}>
              <div className="size-12 rounded-full bg-linear-to-br from-tertiary to-secondary flex items-center justify-center font-black text-white text-lg shadow-md mb-2">
                {p2?.name ? p2.name.substring(0, 2).toUpperCase() : "?"}
              </div>
              <span className="font-extrabold text-white text-sm sm:text-base truncate max-w-full">
                {p2?.name ?? "Por definir"}
              </span>
              <span className="text-xs font-mono text-secondary">{p2?.tag ?? "-"}</span>
              <span className="text-xs text-tertiary font-bold mt-1">
                🏆 {p2?.trophies?.toLocaleString() ?? 0}
              </span>
              <div className="mt-3 flex items-center gap-1">
                <span className="text-3xl font-black text-white">
                  {match.score2 !== null ? match.score2 : "-"}
                </span>
                <span className="text-xl">👑</span>
                {p2Won && <StarIcon className="size-5 text-secondary ml-1" />}
              </div>
            </div>
          </div>

          {/* Decks */}
          {p1 && <DeckGrid cards={match.deck1} playerName={p1.name} />}
          {p2 && <DeckGrid cards={match.deck2} playerName={p2.name} />}

          {/* Sync Button */}
          {onSync && p1 && p2 && (
            <div className="pt-2">
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="w-full bg-secondary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
              >
                <BoltIcon className={`size-5 text-amber-300 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing
                  ? "Buscando partida en Clash Royale..."
                  : "⚡ Sincronizar Batalla en Vivo desde la API"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
