"use client";

import { useState, useEffect } from "react";
import {
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  InformationCircleIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { UserGroupIcon } from "@heroicons/react/24/solid";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const [tournamentInfo, setTournamentInfo] = useState<{
    acceptedCount: number;
    maxPlayers: number;
    tournamentDate: string;
  }>({
    acceptedCount: 0,
    maxPlayers: 16,
    tournamentDate: "",
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const fetchTournamentInfo = async () => {
    try {
      const res = await fetch("/api/tournament");
      const data = await res.json();
      setTournamentInfo({
        acceptedCount: data.acceptedCount || 0,
        maxPlayers: data.maxPlayers || 16,
        tournamentDate: data.tournamentDate || "",
      });
    } catch {
      // fallback to default
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchTournamentInfo());
  }, []);

  useEffect(() => {
    // Si hay una fecha del torneo establecida en la BD la usa; de lo contrario calcula 7 días a futuro por defecto
    const target = tournamentInfo.tournamentDate
      ? new Date(tournamentInfo.tournamentDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000);

    const calculateTimeLeft = () => {
      const difference = target.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [tournamentInfo.tournamentDate]);

  return (
    <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 items-center justify-center font-sans">
      <div className="w-full py-15 md:py-25 px-6 md:px-10">
        <section
          style={{
            boxShadow: "0px 0px 20px -6px var(--tertiary)",
            backgroundImage:
              "url('https://images.unsplash.com/photo-1699962700211-bc05708dc8ef?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
          className="relative bg-cover bg-center bg-no-repeat border-l-4 border-tertiary shadow-tertiary/50 p-6 md:p-20 flex flex-col md:flex-row justify-between gap-6 rounded-xl overflow-hidden mb-16 md:mb-20"
        >
          <div className="absolute top-0 left-0 w-full h-full z-0 bg-primary opacity-80"></div>

          <div className="flex flex-col gap-6 w-full md:w-1/2 z-1">
            <div className="flex items-center gap-1 border border-tertiary/40 bg-tertiary/20 px-3 py-2 rounded-lg max-w-max">
              <FireIcon className="size-4 text-tertiary/80" />
              <Typography
                as="span"
                className="text-tertiary/80 font-extrabold text-xs"
              >
                EVENTO EN VIVO
              </Typography>
            </div>

            <Typography
              variant="h1"
              className="text-4xl md:text-5xl bg-linear-to-t from-secondary bg-clip-text text-transparent to-white font-extrabold leading-tight tracking-tight"
            >
              EL TORNEO DEFINITIVO DE CLASH ROYALE
            </Typography>

            <Typography
              variant="h6"
              className="text-white font-bold md:text-lg"
            >
              Demuestra tu habilidad en la arena. Únete a los mejores jugadores
              en un enfrentamiento épico por la gloria y recompensas exclusivas.
            </Typography>

            <ButtonGroup className="flex gap-4 md:flex-row flex-col md:items-center">
              <Link href="/register" className="w-full md:w-auto">
                <Button
                  fullWidth
                  className="bg-secondary text-white border border-secondary cursor-pointer rounded-lg hover:bg-secondary/80 transition-colors duration-300 ease px-8 py-3"
                >
                  ¡Inscribirse ahora!
                </Button>
              </Link>

              <div className="bg-primary text-white border border-tertiary/40 flex gap-2 items-center justify-center rounded-lg px-8 py-3">
                <UserGroupIcon className="size-5 md:size-4" />
                <span>
                  {tournamentInfo.acceptedCount}/{tournamentInfo.maxPlayers}{" "}
                  Cupos Aceptados
                </span>
              </div>
            </ButtonGroup>
          </div>

          <div className="md:w-2/5 z-1 flex justify-center items-center">
            <Image
              src="/royale.jpg"
              alt="Logo"
              width={500}
              height={500}
              className="rounded-lg shadow-xl shadow-tertiary/40"
            />
          </div>
        </section>

        {/* Sección de Contador en Reversa */}
        <section className="mb-16 md:mb-20">
          <Typography
            variant="h2"
            className="text-slate font-bold flex items-center gap-2 text-lg mb-6"
          >
            <ClockIcon className="size-6 text-tertiary" />
            <span>Inicio del Torneo</span>
          </Typography>

          <Card
            className="bg-primary/90 border border-tertiary/30 p-8 rounded-xl relative overflow-hidden"
            style={{
              boxShadow: "0px 0px 25px -10px var(--tertiary)",
            }}
          >
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative">
              <div className="flex flex-col gap-1 text-center md:text-left">
                <Typography
                  variant="h3"
                  className="text-white font-extrabold text-2xl tracking-tight"
                >
                  ¡La Batalla Comienza Pronto!
                </Typography>
                <Typography variant="small" className="text-neutral text-sm">
                  Prepárate para la primera ronda del torneo. Revisa el contador
                  para no perderte tu enfrentamiento.
                </Typography>
              </div>

              <div className="grid grid-cols-4 gap-3 sm:gap-6 text-center">
                <div className="flex flex-col items-center bg-slate-900/80 border border-tertiary/30 px-4 py-3 sm:px-6 sm:py-4 rounded-xl min-w-17.5 sm:min-w-22.5">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-linear-to-b from-white to-tertiary bg-clip-text text-transparent">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="text-xs uppercase font-semibold text-neutral mt-1">
                    Días
                  </span>
                </div>
                <div className="flex flex-col items-center bg-slate-900/80 border border-tertiary/30 px-4 py-3 sm:px-6 sm:py-4 rounded-xl min-w-17.5 sm:min-w-22.5">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-linear-to-b from-white to-tertiary bg-clip-text text-transparent">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-xs uppercase font-semibold text-neutral mt-1">
                    Horas
                  </span>
                </div>
                <div className="flex flex-col items-center bg-slate-900/80 border border-tertiary/30 px-4 py-3 sm:px-6 sm:py-4 rounded-xl min-w-17.5 sm:min-w-22.5">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-linear-to-b from-white to-tertiary bg-clip-text text-transparent">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-xs uppercase font-semibold text-neutral mt-1">
                    Minutos
                  </span>
                </div>
                <div className="flex flex-col items-center bg-slate-900/80 border border-tertiary/30 px-4 py-3 sm:px-6 sm:py-4 rounded-xl min-w-17.5 sm:min-w-22.5">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-linear-to-b from-white to-tertiary bg-clip-text text-transparent">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-xs uppercase font-semibold text-neutral mt-1">
                    Segundos
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <Typography
            variant="h2"
            className="text-slate font-bold flex items-center gap-2 text-lg mb-6"
          >
            <InformationCircleIcon className="size-6 text-tertiary" />
            <span>Formato del Torneo</span>
          </Typography>

          <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
            <Card className="p-4 rounded-xl hover:shadow hover:shadow-secondary transition-shadow duration-300 overflow-hidden bg-primary border-l-4 border-secondary w-full">
              <CardHeader className="w-max mb-4">
                <div className="bg-secondary/40 p-2">
                  <TrophyIcon className="size-8 text-neutral" />
                </div>
              </CardHeader>

              <CardBody>
                <Typography variant="h5" className="text-white font-bold mb-2">
                  Mejor de 3
                </Typography>
                <Typography variant="small" className="text-slate">
                  Cada enfrentamiento se decide al mejor de 3 partidas.
                  Demuestra tu versatilidad con diferentes mazos.
                </Typography>
              </CardBody>
            </Card>

            <Card className="p-4 rounded-xl hover:shadow hover:shadow-secondary transition-shadow duration-300 overflow-hidden bg-primary border-l-4 border-secondary w-full">
              <CardHeader className="w-max mb-4">
                <div className="bg-secondary/40 p-2">
                  <ExclamationTriangleIcon className="size-8 text-neutral" />
                </div>
              </CardHeader>

              <CardBody>
                <Typography variant="h5" className="text-white font-bold mb-2">
                  Eliminación Directa
                </Typography>
                <Typography variant="small" className="text-slate">
                  Sin segundas oportunidades. Un error puede costarte el
                  campeonato. Tensión al máximo nivel.
                </Typography>
              </CardBody>
            </Card>

            <Card className="p-4 rounded-xl hover:shadow hover:shadow-secondary transition-shadow duration-300 overflow-hidden bg-primary border-l-4 border-secondary w-full">
              <CardHeader className="w-max mb-4">
                <div className="bg-secondary/40 p-2">
                  <UserGroupIcon className="size-8 text-neutral" />
                </div>
              </CardHeader>

              <CardBody>
                <Typography variant="h5" className="text-white font-bold mb-2">
                  {tournamentInfo.maxPlayers} Jugadores
                </Typography>
                <Typography variant="small" className="text-slate">
                  Un bracket exclusivo con los combatientes más feroces. Solo
                  uno se coronará como el Maestro Royale.
                </Typography>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
