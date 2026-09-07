"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  TrophyIcon,
  UserGroupIcon,
  ClockIcon,
  PlayIcon,
  ArrowPathIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import MatchModal from "@/src/components/MatchModal";

interface Player {
  id: string;
  tag: string;
  name: string;
  trophies: number;
  bestTrophies: number;
  expLevel: number;
  clan: { name: string; tag: string } | null;
  arena: string | null;
  contact: string;
  status: "pending" | "accepted" | "rejected";
  registeredAt: string;
}

interface MatchPlayer {
  id: string;
  name: string;
  tag: string;
  trophies: number;
}

interface CardItem {
  name: string;
  level: number;
  maxLevel: number;
  iconUrl: string;
}

interface Match {
  id: string;
  round: string;
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  winner: string | null;
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

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<
    "pending" | "accepted" | "bracket" | "config"
  >("pending");

  const [players, setPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [msg, setMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [tournamentDate, setTournamentDate] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [syncing, setSyncing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{
    match: Match;
    roundLabel: string;
  } | null>(null);

  const showMsg = useCallback((text: string, type: "success" | "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [resPlayers, resTourney] = await Promise.all([
        fetch("/api/players?status=all", {
          headers: { "x-admin-auth": "true" },
        }),
        fetch("/api/tournament"),
      ]);

      const dataPlayers = await resPlayers.json();
      const dataTourney = await resTourney.json();

      setPlayers(dataPlayers.players || []);
      setTournament(dataTourney);
      if (dataTourney.tournamentDate) {
        setTournamentDate(dataTourney.tournamentDate.substring(0, 16));
      }
      if (dataTourney.maxPlayers) {
        setMaxPlayers(dataTourney.maxPlayers);
      }
    } catch {
      showMsg("Error cargando información", "error");
    }
  }, [showMsg]);

  useEffect(() => {
    const isAuth = sessionStorage.getItem("admin_auth");
    if (isAuth === "true") {
      setAuthenticated(true);
      fetchData();
    }
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("admin_auth", "true");
        setAuthenticated(true);
        fetchData();
      } else {
        setLoginError(data.message || "Contraseña incorrecta");
      }
    } catch {
      setLoginError("Error de conexión al servidor");
    }
  };

  const updatePlayerStatus = async (
    id: string,
    status: "accepted" | "rejected" | "pending"
  ) => {
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showMsg(`Estado del jugador actualizado a ${status}`, "success");
        fetchData();
      } else {
        const err = await res.json();
        showMsg(err.message || "Error al actualizar", "error");
      }
    } catch {
      showMsg("Error de conexión", "error");
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este jugador?")) return;
    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (res.ok) {
        showMsg("Jugador eliminado", "success");
        fetchData();
      }
    } catch {
      showMsg("Error eliminando jugador", "error");
    }
  };

  const handleGenerateBracket = async () => {
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_bracket" }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("Bracket generado con éxito", "success");
        fetchData();
      } else {
        showMsg(data.message || "Error al generar bracket", "error");
      }
    } catch {
      showMsg("Error de conexión", "error");
    }
  };

  const handleSyncBattles = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/tournament/sync-battles", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showMsg(data.message || "Partidas sincronizadas", "success");
        fetchData();
      } else {
        showMsg(data.message || "Error al sincronizar partidas", "error");
      }
    } catch {
      showMsg("Error al conectar con la API de sincronización", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleResetBracket = async () => {
    if (
      !confirm(
        "¿Deseas reiniciar el bracket actual? Se perderán los marcadores."
      )
    )
      return;
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_bracket" }),
      });
      if (res.ok) {
        showMsg("Bracket reseteado", "success");
        fetchData();
      }
    } catch {
      showMsg("Error al resetear bracket", "error");
    }
  };

  const handleUpdateMatch = async (
    matchId: string,
    score1: number,
    score2: number,
    winnerId: string | null
  ) => {
    try {
      const res = await fetch(`/api/tournament/match/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score1, score2, winner: winnerId }),
      });
      if (res.ok) {
        showMsg("Resultado guardado", "success");
        fetchData();
      } else {
        showMsg("Error actualizando resultado", "error");
      }
    } catch {
      showMsg("Error de conexión", "error");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentDate, maxPlayers }),
      });
      if (res.ok) {
        showMsg("Configuración guardada", "success");
        fetchData();
      }
    } catch {
      showMsg("Error al guardar configuración", "error");
    }
  };

  if (!authenticated) {
    return (
      <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 items-center justify-center font-sans p-6">
        <div className="w-full max-w-md bg-primary border border-secondary/30 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-white font-extrabold text-2xl text-center mb-2">
            Panel de Control Admin
          </h3>
          <p className="text-neutral text-sm text-center mb-6 block">
            Ingresa la contraseña del administrador para continuar.
          </p>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm mb-4 text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="********"
              value={passwordInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordInput(e.target.value)
              }
              className="bg-white text-neutral-800 p-3 rounded-lg text-sm border-none w-full"
            />
            <button
              type="submit"
              className="bg-secondary text-white py-3 rounded-lg font-bold hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingPlayers = players.filter((p) => p.status === "pending");
  const acceptedPlayers = players.filter((p) => p.status === "accepted");
  const rejectedPlayers = players.filter((p) => p.status === "rejected");

  return (
    <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 font-sans">
      <div className="w-full py-12 px-6 md:px-16 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-white">
              Administración del Torneo
            </h2>
            <p className="text-neutral text-sm">
              Acepta solicitudes de jugadores, gestiona el cuadro y configura el
              evento.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_auth");
                setAuthenticated(false);
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg text-neutral border border-neutral/30 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {msg && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border ${
              msg.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <span>{msg.text}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-primary/80 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <ClockIcon className="size-8 text-amber-400" />
              <div>
                <span className="text-xs text-neutral block">Pendientes</span>
                <span className="text-2xl font-bold text-white">
                  {pendingPlayers.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary/80 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="size-8 text-green-400" />
              <div>
                <span className="text-xs text-neutral block">Aceptados</span>
                <span className="text-2xl font-bold text-white">
                  {acceptedPlayers.length} / {tournament?.maxPlayers ?? 16}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary/80 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <TrophyIcon className="size-8 text-secondary" />
              <div>
                <span className="text-xs text-neutral block">Estado Bracket</span>
                <span className="text-lg font-bold text-white uppercase">
                  {tournament?.bracket ? "Generado" : "Pendiente"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary/80 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <XMarkIcon className="size-8 text-red-400" />
              <div>
                <span className="text-xs text-neutral block">Rechazados</span>
                <span className="text-2xl font-bold text-white">
                  {rejectedPlayers.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6 gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 px-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "pending"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-neutral hover:text-white"
            }`}
          >
            Pendientes ({pendingPlayers.length})
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`pb-3 px-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "accepted"
                ? "border-green-400 text-green-400"
                : "border-transparent text-neutral hover:text-white"
            }`}
          >
            Aceptados ({acceptedPlayers.length})
          </button>
          <button
            onClick={() => setActiveTab("bracket")}
            className={`pb-3 px-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "bracket"
                ? "border-secondary text-secondary"
                : "border-transparent text-neutral hover:text-white"
            }`}
          >
            Gestionar Bracket
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`pb-3 px-2 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === "config"
                ? "border-tertiary text-tertiary"
                : "border-transparent text-neutral hover:text-white"
            }`}
          >
            Configuración
          </button>
        </div>

        {/* Tab 1: Pendientes */}
        {activeTab === "pending" && (
          <div className="bg-primary border border-white/10 rounded-xl overflow-hidden">
            {pendingPlayers.length === 0 ? (
              <div className="p-8 text-center text-neutral">
                No hay solicitudes pendientes de registro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-neutral uppercase text-xs">
                    <tr>
                      <th className="p-4">Jugador</th>
                      <th className="p-4">Tag</th>
                      <th className="p-4">Trofeos</th>
                      <th className="p-4">Contacto</th>
                      <th className="p-4">Fecha</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="p-4 font-bold text-white">
                          {p.name}
                          <span className="block text-xs font-normal text-neutral/70">
                            Nivel {p.expLevel}{" "}
                            {p.clan ? `· ${p.clan.name}` : ""}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-secondary">
                          {p.tag}
                        </td>
                        <td className="p-4 text-tertiary font-bold">
                          🏆 {p.trophies.toLocaleString()}
                        </td>
                        <td className="p-4 text-neutral">{p.contact}</td>
                        <td className="p-4 text-xs text-neutral/60">
                          {new Date(p.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                updatePlayerStatus(p.id, "accepted")
                              }
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/40 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Aceptar"
                            >
                              <CheckIcon className="size-5" />
                            </button>
                            <button
                              onClick={() =>
                                updatePlayerStatus(p.id, "rejected")
                              }
                              className="bg-red-500/20 text-red-400 hover:bg-red-500/40 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Rechazar"
                            >
                              <XMarkIcon className="size-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Aceptados */}
        {activeTab === "accepted" && (
          <div className="bg-primary border border-white/10 rounded-xl overflow-hidden">
            {acceptedPlayers.length === 0 ? (
              <div className="p-8 text-center text-neutral">
                No hay jugadores aceptados todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-neutral uppercase text-xs">
                    <tr>
                      <th className="p-4">Jugador</th>
                      <th className="p-4">Tag</th>
                      <th className="p-4">Trofeos</th>
                      <th className="p-4">Contacto</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {acceptedPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="p-4 font-bold text-white">{p.name}</td>
                        <td className="p-4 font-mono text-secondary">
                          {p.tag}
                        </td>
                        <td className="p-4 text-tertiary font-bold">
                          🏆 {p.trophies.toLocaleString()}
                        </td>
                        <td className="p-4 text-neutral">{p.contact}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                updatePlayerStatus(p.id, "pending")
                              }
                              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 p-2 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Mover a pendientes"
                            >
                              Revocar
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(p.id)}
                              className="bg-red-500/20 text-red-400 hover:bg-red-500/40 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bracket */}
        {activeTab === "bracket" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-4 items-center bg-primary p-6 border border-white/10 rounded-xl">
              <button
                onClick={handleGenerateBracket}
                disabled={acceptedPlayers.length < 2}
                className="bg-secondary text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                <PlayIcon className="size-5" />
                Generar Bracket con Jugadores Aceptados (
                {acceptedPlayers.length})
              </button>

              {tournament?.bracket && (
                <>
                  <button
                    onClick={handleSyncBattles}
                    disabled={syncing}
                    className="bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer text-sm"
                  >
                    <BoltIcon className={`size-5 ${syncing ? "animate-spin" : ""}`} />
                    ⚡ Auto-Sincronizar Partidas API
                  </button>

                  <button
                    onClick={handleResetBracket}
                    className="border border-red-500/40 text-red-400 hover:bg-red-500/10 px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer text-sm"
                  >
                    <ArrowPathIcon className="size-5" />
                    Reiniciar Bracket
                  </button>
                </>
              )}
            </div>

            {!tournament?.bracket ? (
              <div className="bg-primary/50 border border-white/10 p-12 rounded-xl text-center text-neutral">
                Haz clic en &quot;Generar Bracket&quot; para emparejar
                automáticamente a los jugadores aceptados ordenados por trofeos.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournament.bracket.rounds.map((round) => (
                  <div
                    key={round.key}
                    className="bg-primary border border-white/10 rounded-xl p-4"
                  >
                    <h4 className="text-tertiary font-bold mb-4 border-b border-white/10 pb-2 text-base flex justify-between items-center">
                      <span>{round.label}</span>
                      <span className="text-xs text-neutral font-normal">
                        {round.matches.length} partidos
                      </span>
                    </h4>

                    <div className="flex flex-col gap-4">
                      {round.matches.map((match) => (
                        <AdminMatchCard
                          key={match.id}
                          match={match}
                          roundLabel={round.label}
                          onSave={(s1, s2, winnerId) =>
                            handleUpdateMatch(match.id, s1, s2, winnerId)
                          }
                          onInspect={() =>
                            setSelectedMatch({
                              match,
                              roundLabel: round.label,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de inspección de partido */}
        <MatchModal
          match={selectedMatch?.match ?? null}
          roundLabel={selectedMatch?.roundLabel ?? ""}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSync={async () => {
            await handleSyncBattles();
            fetchData();
          }}
          isSyncing={syncing}
        />

        {/* Tab 4: Configuración */}
        {activeTab === "config" && (
          <div className="bg-primary border border-white/10 rounded-xl p-6 max-w-xl">
            <h3 className="text-white font-bold text-lg mb-4">
              Configuración del Torneo
            </h3>

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-neutral block mb-1 font-bold">
                  Fecha y Hora de Inicio
                </label>
                <input
                  type="datetime-local"
                  value={tournamentDate}
                  onChange={(e) => setTournamentDate(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-neutral block mb-1 font-bold">
                  Máximo de Jugadores
                </label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-white/10 text-white text-sm"
                />
              </div>

              <button
                type="submit"
                className="bg-secondary text-white font-bold py-3 rounded-lg hover:bg-secondary/80 transition-colors mt-2 cursor-pointer"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponente para editar marcador de un partido en admin
function AdminMatchCard({
  match,
  onSave,
  onInspect,
}: {
  match: Match;
  roundLabel: string;
  onSave: (s1: number, s2: number, winnerId: string | null) => void;
  onInspect: () => void;
}) {
  const [s1, setS1] = useState(match.score1 ?? 0);
  const [s2, setS2] = useState(match.score2 ?? 0);

  const p1 = match.player1;
  const p2 = match.player2;

  const handleWinner = (winnerId: string) => {
    onSave(s1, s2, winnerId);
  };

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-lg p-3 flex flex-col gap-2 relative">
      {/* Header bar */}
      <div className="flex items-center justify-between text-[10px] text-neutral/50 border-b border-white/5 pb-1">
        <span>ID: {match.id}</span>
        {match.autoValidated && (
          <span className="text-amber-300 font-bold bg-amber-500/20 px-1.5 rounded">
            ⚡ Autovalidado API
          </span>
        )}
        {p1 && p2 && (
          <button
            onClick={onInspect}
            className="text-secondary hover:underline cursor-pointer font-bold ml-auto"
          >
            🎴 Ver Mazos
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-white truncate max-w-[100px]">
          {p1?.name ?? "Por definir"}
        </span>
        {p1 && (
          <input
            type="number"
            value={s1}
            onChange={(e) => setS1(Number(e.target.value))}
            className="w-10 bg-slate-800 border border-white/20 text-center rounded text-white py-0.5"
          />
        )}
        {p1 && (
          <button
            onClick={() => handleWinner(p1.id)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
              match.winner === p1.id
                ? "bg-green-500 text-white"
                : "bg-white/10 text-neutral hover:text-white"
            }`}
          >
            Ganador
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-white truncate max-w-[100px]">
          {p2?.name ?? "Por definir"}
        </span>
        {p2 && (
          <input
            type="number"
            value={s2}
            onChange={(e) => setS2(Number(e.target.value))}
            className="w-10 bg-slate-800 border border-white/20 text-center rounded text-white py-0.5"
          />
        )}
        {p2 && (
          <button
            onClick={() => handleWinner(p2.id)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
              match.winner === p2.id
                ? "bg-green-500 text-white"
                : "bg-white/10 text-neutral hover:text-white"
            }`}
          >
            Ganador
          </button>
        )}
      </div>
    </div>
  );
}
