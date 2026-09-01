"use client";

import { useState } from "react";
import { Button, Input, Typography } from "@material-tailwind/react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      sessionStorage.setItem("admin_auth", "true");
      window.location.href = "/admin";
    } else {
      alert("Credenciales incorrectas (Usa: admin / admin123)");
    }
  };

  return (
    <div className="bg-linear-to-r from-primary via-secondary/10 to-tertiary/10 flex flex-col flex-1 items-center justify-center font-sans">
      <div className="w-full max-w-lg py-15 px-6">
        <div
          style={{ boxShadow: "0px 0px 20px -6px var(--secondary)" }}
          className="rounded-xl bg-primary border-l-3 border-secondary p-8 md:p-12 overflow-hidden"
        >
          <Typography
            variant="h1"
            className="text-3xl md:text-4xl text-center bg-linear-to-t from-secondary bg-clip-text text-transparent to-white font-extrabold leading-tight tracking-tight mb-4"
          >
            Iniciar Sesión
          </Typography>

          <Typography
            variant="h6"
            className="text-white font-bold text-sm text-center mb-6"
          >
            Acceso al Panel de Administración del Torneo
          </Typography>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <Typography
                as="label"
                variant="h6"
                color="blue-gray"
                className="mb-1 text-white text-sm"
              >
                Usuario
              </Typography>
              <Input
                id="user"
                size="lg"
                placeholder="admin"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="border-none bg-white text-neutral-800 rounded-lg"
              />
            </div>

            <div className="flex flex-col">
              <Typography
                as="label"
                variant="h6"
                color="blue-gray"
                className="mb-1 text-white text-sm"
              >
                Contraseña
              </Typography>
              <Input
                id="password"
                type="password"
                size="lg"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="border-none bg-white text-neutral-800 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              className="bg-secondary text-white border border-secondary cursor-pointer rounded-lg hover:bg-secondary/80 transition-colors duration-300 ease px-8 py-3 mt-4"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/register" className="text-xs text-neutral hover:text-secondary">
              ¿Eres jugador? Registrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
