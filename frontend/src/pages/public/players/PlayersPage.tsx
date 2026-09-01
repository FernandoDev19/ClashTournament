"use client";

import {
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Chip,
  Typography,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";

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
  status: string;
  wins: number;
  losses: number;
}

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const isAuth = sessionStorage.getItem("admin_auth") === "true";
    setIsAdmin(isAuth);
  }, []);

  const TABLE_HEAD = [
    "Ranking",
    "Jugador",
    "Tag",
    "Trofeos",
    "Arena / Clan",
    ...(isAdmin ? ["Contacto"] : []),
    "Estado",
  ];

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const isAuth = sessionStorage.getItem("admin_auth") === "true";
      const headers: Record<string, string> = {};
      if (isAuth) {
        headers["x-admin-auth"] = "true";
      }

      const res = await fetch("/api/players?status=accepted", { headers });
      if (!res.ok) throw new Error("Error al obtener jugadores");
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la lista de jugadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchPlayers());
  }, []);


  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.clan?.name && p.clan.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 items-center justify-center font-sans">
      <div className="w-full py-15 md:py-25 px-6 md:px-20">
        <div className="flex items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <Typography
              variant="h1"
              className="md:text-5xl bg-linear-to-t from-secondary bg-clip-text text-transparent to-white font-extrabold leading-tight tracking-tight mb-2"
            >
              Ranking de Jugadores
            </Typography>

            <Typography
              variant="h6"
              className="text-white font-bold md:text-lg mb-4"
            >
              Jugadores oficialmente aceptados y clasificados para el torneo.
            </Typography>
          </div>

          <div className="w-full md:w-auto">
            <div className="mb-4 relative min-w-[280px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="size-5 text-neutral" />
              </span>
              <input
                type="text"
                placeholder="Buscar Tag, Nombre o Clan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 rounded-xl border border-secondary/30 focus:border-secondary/70 focus:outline-none bg-primary text-sm shadow-xs transition-all text-neutral placeholder:text-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white hover:text-charcoal text-xs cursor-pointer"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral">
            <div className="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-secondary rounded-full mb-2" />
            <p>Cargando lista de jugadores...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-6 rounded-xl text-center my-6">
            {error}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="bg-primary/60 border border-white/10 text-neutral p-12 rounded-xl text-center my-6">
            <Typography variant="h5" className="text-white font-bold mb-2">
              No hay jugadores aceptados aún
            </Typography>
            <Typography variant="small">
              {searchQuery
                ? "No se encontraron coincidencias para la búsqueda."
                : "Regístrate en la sección de Registro o espera a que el administrador apruebe las solicitudes."}
            </Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              style={{ boxShadow: "0px 0px 20px -6px var(--neutral)" }}
              className="mt-4 w-full min-w-max table-auto text-left bg-primary rounded-xl overflow-hidden mb-6"
            >
              <thead className="bg-secondary/10 border-none">
                <tr>
                  {TABLE_HEAD.map((head) => (
                    <th
                      key={head}
                      className="p-4 transition-colors hover:bg-secondary/20"
                    >
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="flex items-center justify-between gap-2 font-normal leading-none opacity-70"
                      >
                        {head}{" "}
                        <ChevronUpDownIcon strokeWidth={2} className="h-4 w-4" />
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-secondary/18">
                {filteredPlayers.map((player, index) => {
                  const isLast = index === filteredPlayers.length - 1;
                  const classes = isLast
                    ? "p-4"
                    : "p-4 border-b border-secondary/20";

                  return (
                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                      <td className={classes}>
                        <div className="w-max">
                          <Chip
                            variant="ghost"
                            size="sm"
                            value={`#${index + 1}`}
                            className={
                              index === 0
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : index === 1
                                ? "bg-slate-300/20 text-slate-200 border-slate-300/40"
                                : index === 2
                                ? "bg-amber-700/20 text-amber-500 border-amber-700/40"
                                : "text-neutral border-white/10"
                            }
                          />
                        </div>
                      </td>
                      <td className={classes}>
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center font-bold text-secondary text-sm">
                            {player.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-bold text-white"
                            >
                              {player.name}
                            </Typography>
                            <Typography
                              variant="small"
                              className="text-xs text-neutral/60"
                            >
                              Nivel {player.expLevel}
                            </Typography>
                          </div>
                        </div>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-mono text-xs text-secondary"
                        >
                          {player.tag}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <div className="flex flex-col">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-bold text-tertiary flex items-center gap-1"
                          >
                            🏆 {player.trophies.toLocaleString()}
                          </Typography>
                          <Typography
                            variant="small"
                            className="text-[10px] text-neutral/50"
                          >
                            Máx: {player.bestTrophies.toLocaleString()}
                          </Typography>
                        </div>
                      </td>
                      <td className={classes}>
                        <div className="flex flex-col">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal text-white text-xs"
                          >
                            {player.arena ?? "Arena N/A"}
                          </Typography>
                          {player.clan && (
                            <Typography
                              variant="small"
                              className="text-[11px] text-neutral/70"
                            >
                              🏰 {player.clan.name}
                            </Typography>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className={classes}>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal text-neutral text-xs"
                          >
                            {player.contact}
                          </Typography>
                        </td>
                      )}
                      <td className={classes}>
                        <Chip
                          variant="ghost"
                          size="sm"
                          value="Aceptado"
                          className="text-green-400 border-green-500/30 bg-green-500/10 text-xs w-max"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="w-full flex items-center justify-between px-4 mt-4">
          <Typography variant="small" color="blue-gray" className="font-normal text-neutral">
            Mostrando {filteredPlayers.length} jugador(es)
          </Typography>
        </div>
      </div>
    </div>
  );
}
