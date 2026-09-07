"use client";

import { useState, useRef } from "react";
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Button, Input, Typography } from "@material-tailwind/react";

interface ClashPlayer {
  tag: string;
  name: string;
  trophies: number;
  bestTrophies: number;
  expLevel: number;
  clan: { name: string; tag: string } | null;
  arena: string | null;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function RegisterPage() {
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [trophies, setTrophies] = useState("");
  const [contact, setContact] = useState("");

  const [player, setPlayer] = useState<ClashPlayer | null>(null);
  const [tagStatus, setTagStatus] = useState<
    "idle" | "loading" | "found" | "error"
  >("idle");
  const [tagError, setTagError] = useState("");

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupPlayer = async (rawTag: string) => {
    const cleaned = rawTag.toUpperCase().trim();
    if (cleaned.length < 3) {
      setTagStatus("idle");
      setPlayer(null);
      setName("");
      setTrophies("");
      return;
    }

    setTagStatus("loading");
    setTagError("");

    try {
      const encoded = encodeURIComponent(cleaned.replace(/^#/, ""));
      const res = await fetch(`/api/player/${encoded}`);
      const data = await res.json();

      if (!res.ok) {
        setTagStatus("error");
        setTagError(data.message ?? "Jugador no encontrado");
        setPlayer(null);
        setName("");
        setTrophies("");
        return;
      }

      setPlayer(data as ClashPlayer);
      setName(data.name);
      setTrophies(String(data.trophies));
      setTagStatus("found");
    } catch {
      setTagStatus("error");
      setTagError("Error de conexión. Intenta de nuevo.");
      setPlayer(null);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTag(value);
    setTagStatus("idle");
    setPlayer(null);
    setName("");
    setTrophies("");
    setSubmitStatus("idle");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lookupPlayer(value);
    }, 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tagStatus !== "found" || !player || !contact) return;

    setSubmitStatus("loading");
    setSubmitError("");

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: player.tag,
          name: player.name,
          trophies: player.trophies,
          bestTrophies: player.bestTrophies,
          expLevel: player.expLevel,
          clan: player.clan,
          arena: player.arena,
          contact,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitStatus("error");
        setSubmitError(data.message ?? "Error al registrar. Intenta de nuevo.");
        return;
      }

      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Error de conexión. Intenta de nuevo.");
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 items-center justify-center font-sans py-8 md:py-0 px-4 sm:px-6">
        <div className="w-full max-w-4xl py-6 md:py-25 px-0 md:px-10">
          <div
            style={{ boxShadow: "0px 0px 20px -6px var(--secondary)" }}
            className="rounded-xl bg-primary border-l-3 border-secondary p-6 md:p-20 flex flex-col items-center gap-6 text-center"
          >
            <div className="bg-green-500/20 rounded-full p-4 md:p-5">
              <CheckCircleIcon className="size-12 md:size-16 text-green-400" />
            </div>
            <Typography
              variant="h2"
              className="text-white font-extrabold text-2xl md:text-3xl"
            >
              ¡Registro exitoso!
            </Typography>
            <Typography variant="h6" className="text-neutral font-medium text-sm md:text-base">
              Tu solicitud fue enviada. El administrador revisará tu registro y
              recibirás confirmación pronto.
            </Typography>
            <div className="w-full max-w-sm border border-secondary/30 bg-secondary/10 rounded-xl px-4 py-3 md:px-6 md:py-4 flex flex-col gap-1">
              <Typography variant="small" className="text-neutral text-xs md:text-sm">
                Registrado como
              </Typography>
              <Typography variant="h5" className="text-white font-extrabold text-lg md:text-xl">
                {name}
              </Typography>
              <Typography variant="small" className="text-secondary text-xs md:text-sm">
                {player?.tag}
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 items-center justify-center font-sans py-8 md:py-0 px-4 sm:px-6">
      <div className="w-full max-w-4xl py-6 md:py-25 px-0 sm:px-4 md:px-10">
        <div
          style={{ boxShadow: "0px 0px 20px -6px var(--secondary)" }}
          className="rounded-xl bg-primary border-l-3 border-secondary p-5 sm:p-8 md:p-16 lg:p-20 overflow-hidden"
        >
          <Typography
            variant="h1"
            className="text-2xl sm:text-3xl md:text-4xl text-center bg-linear-to-t from-secondary bg-clip-text text-transparent to-white font-extrabold leading-tight tracking-tight mb-3 md:mb-4"
          >
            Registrarse al torneo
          </Typography>

          <Typography
            variant="h6"
            className="text-white font-bold text-sm sm:text-base md:text-lg text-center mb-6"
          >
            Asegura tu lugar en la próxima fase del cuadro. Valida los datos de
            tu perfil de jugador a continuación.
          </Typography>

          {/* Card del jugador encontrado */}
          {tagStatus === "found" && player && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-secondary/40 bg-secondary/10 rounded-xl p-4 sm:px-5 sm:py-4 animate-in fade-in">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="bg-secondary/20 rounded-full p-2 shrink-0">
                  <CheckCircleIcon className="size-6 sm:size-8 text-secondary" />
                </div>
                <div className="flex flex-col">
                  <Typography variant="h5" className="text-white font-extrabold text-base sm:text-lg">
                    {player.name}
                  </Typography>
                  <Typography variant="small" className="text-neutral text-xs sm:text-sm">
                    {player.tag} &nbsp;·&nbsp; Nivel {player.expLevel}{" "}
                    &nbsp;·&nbsp; {player.arena ?? "Arena desconocida"}{" "}
                    {player.clan ? `· 🏰 ${player.clan.name}` : "· Sin clan"}
                  </Typography>
                </div>
              </div>
              <div className="sm:ml-auto text-left sm:text-right border-t border-secondary/20 pt-3 sm:border-t-0 sm:pt-0 shrink-0">
                <Typography
                  variant="h5"
                  className="text-tertiary font-extrabold text-base sm:text-lg"
                >
                  {player.trophies.toLocaleString()} 🏆
                </Typography>
                <Typography variant="small" className="text-neutral text-xs sm:text-sm">
                  Máx: {player.bestTrophies.toLocaleString()}
                </Typography>
              </div>
            </div>
          )}

          {/* Error de tag */}
          {tagStatus === "error" && (
            <div className="mb-6 flex items-center gap-3 border border-red-500/40 bg-red-500/10 rounded-xl p-4 sm:px-5 sm:py-4">
              <XCircleIcon className="size-6 text-red-400 shrink-0" />
              <Typography variant="small" className="text-red-300 text-xs sm:text-sm">
                {tagError}
              </Typography>
            </div>
          )}

          {/* Error de submit */}
          {submitStatus === "error" && (
            <div className="mb-6 flex items-center gap-3 border border-red-500/40 bg-red-500/10 rounded-xl p-4 sm:px-5 sm:py-4">
              <XCircleIcon className="size-6 text-red-400 shrink-0" />
              <Typography variant="small" className="text-red-300 text-xs sm:text-sm">
                {submitError}
              </Typography>
            </div>
          )}

          <form className="mt-6 md:mt-8 mb-2 w-full" onSubmit={handleSubmit}>
            <div className="mb-8 md:mb-10 flex flex-col gap-4 md:gap-6">
              {/* Fila 1: Nombre + Tag */}
              <div className="flex flex-col sm:flex-row items-start justify-between w-full gap-4 md:gap-6">
                {/* Nombre (autocompletado) */}
                <div className="flex flex-col w-full sm:w-1/2">
                  <Typography
                    as="label"
                    variant="h6"
                    color="blue-gray"
                    className="mb-1 text-sm md:text-base"
                  >
                    Nombre
                  </Typography>
                  <Input
                    id="name"
                    size="lg"
                    placeholder="Se obtiene automáticamente"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    disabled={tagStatus === "loading" || tagStatus === "found"}
                    readOnly={tagStatus === "loading" || tagStatus === "found"}
                    className={`border-none border-t-blue-gray-200! focus:border-t-gray-900! rounded-lg ${
                      tagStatus === "loading" || tagStatus === "found"
                        ? "bg-slate-800/80 text-neutral-500 cursor-not-allowed"
                        : "bg-white text-neutral-600"
                    }`}
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                  />
                  {tagStatus === "found" && (
                    <Typography
                      variant="small"
                      className="text-secondary/80 mt-1 text-xs"
                    >
                      ✓ Obtenido de Clash Royale
                    </Typography>
                  )}
                </div>

                {/* Tag de Clash Royale */}
                <div className="flex flex-col w-full sm:w-1/2">
                  <Typography
                    as="label"
                    variant="h6"
                    color="blue-gray"
                    className="mb-1 text-sm md:text-base"
                  >
                    Tag de Clash Royale
                  </Typography>
                  <div className="relative">
                    <Input
                      id="clash-royale-tag"
                      size="lg"
                      placeholder="#3J3MPL0"
                      value={tag}
                      onChange={handleTagChange}
                      className="border-none bg-white border-t-blue-gray-200! focus:border-t-gray-900! rounded-lg text-neutral-600 pr-10"
                      labelProps={{
                        className: "before:content-none after:content-none",
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {tagStatus === "loading" && (
                        <svg
                          className="size-5 text-secondary animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                      )}
                      {tagStatus === "found" && (
                        <CheckCircleIcon className="size-5 text-green-500" />
                      )}
                      {tagStatus === "error" && (
                        <XCircleIcon className="size-5 text-red-400" />
                      )}
                      {tagStatus === "idle" && tag && (
                        <MagnifyingGlassIcon className="size-5 text-neutral" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila 2: Trofeos + Contacto */}
              <div className="flex flex-col sm:flex-row items-start justify-between w-full gap-4 md:gap-6">
                {/* Trofeos (autocompletado) */}
                <div className="flex flex-col w-full sm:w-1/2">
                  <Typography
                    as="label"
                    variant="h6"
                    color="blue-gray"
                    className="mb-1 text-sm md:text-base"
                  >
                    Cantidad de trofeos
                  </Typography>
                  <Input
                    id="trophies"
                    size="lg"
                    placeholder="Se obtiene automáticamente"
                    value={trophies}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrophies(e.target.value)}
                    disabled={tagStatus === "loading" || tagStatus === "found"}
                    readOnly={tagStatus === "loading" || tagStatus === "found"}
                    className={`border-none border-t-blue-gray-200! focus:border-t-gray-900! rounded-lg ${
                      tagStatus === "loading" || tagStatus === "found"
                        ? "bg-slate-800/80 text-neutral-500 cursor-not-allowed"
                        : "bg-white text-neutral-600"
                    }`}
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                  />
                  {tagStatus === "found" && (
                    <Typography
                      variant="small"
                      className="text-secondary/80 mt-1 text-xs"
                    >
                      ✓ Obtenido de Clash Royale
                    </Typography>
                  )}
                </div>

                {/* Discord / Whatsapp */}
                <div className="flex flex-col w-full sm:w-1/2">
                  <Typography
                    as="label"
                    variant="h6"
                    color="blue-gray"
                    className="mb-1 text-sm md:text-base"
                  >
                    Discord / Whatsapp ID
                  </Typography>
                  <Input
                    id="discord-whatsapp-id"
                    size="lg"
                    placeholder="User#1234 or +57300..."
                    value={contact}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContact(e.target.value)}
                    className="border-none bg-white border-t-blue-gray-200! focus:border-t-gray-900! rounded-lg text-neutral-600"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={
                tagStatus !== "found" ||
                !contact ||
                submitStatus === "loading"
              }
              className="bg-secondary text-white border border-secondary cursor-pointer rounded-lg hover:bg-secondary/80 transition-colors duration-300 ease px-6 md:px-8 py-3 text-sm md:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitStatus === "loading"
                ? "Enviando registro..."
                : tagStatus === "loading"
                ? "Verificando jugador..."
                : "Registrarse"}
            </Button>

            {tagStatus !== "found" && (
              <Typography
                variant="small"
                className="text-neutral/60 text-center mt-3 text-xs"
              >
                Ingresa tu tag de Clash Royale para habilitar el registro
              </Typography>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
