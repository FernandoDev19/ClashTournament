"use client";

import { useState } from "react";
import { PlayIcon, SignalIcon } from "@heroicons/react/24/solid";

const USER = process.env.NEXT_PUBLIC_TIKTOK_LIVE_USER ?? "";

export default function LiveStream() {
  const [showEmbed, setShowEmbed] = useState(false);
  if (!USER) return null;

  const liveUrl = `https://www.tiktok.com/@${USER}/live`;
  const embedUrl = `https://www.tiktok.com/embed/live/@${USER}?autoplay=1&muted=1&controls=1&embed_domain=${
    typeof window !== "undefined" ? window.location.hostname : ""
  }`;

  return (
    <section
      className="rounded-xl border border-tertiary/30 bg-primary/90 p-6 md:p-8"
      style={{ boxShadow: "0px 0px 25px -10px var(--tertiary)" }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <SignalIcon className="size-6 text-tertiary" />
          <h2 className="text-white font-bold text-lg">Mira el torneo en vivo</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary text-white font-bold rounded-lg px-5 py-2.5 text-sm text-center hover:bg-secondary/80 transition-colors"
          >
            Ver en TikTok
          </a>
          {!showEmbed && (
            <button
              onClick={() => setShowEmbed(true)}
              className="border border-white/20 text-neutral hover:text-white rounded-lg px-5 py-2.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <PlayIcon className="size-4" />
              Ver aquí
            </button>
          )}
        </div>
      </div>

      {showEmbed && (
        <div className="mx-auto w-full max-w-sm">
          {/* TikTok exige width y height explícitos; ajusta la altura si el live es horizontal */}
          <iframe
            src={embedUrl}
            title="TikTok LIVE"
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-[70vh] max-h-160 rounded-lg border-0"
          />
          <p className="text-xs text-neutral/70 text-center mt-2">
            ¿No carga? Míralo directo en{" "}
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-secondary underline">
              TikTok
            </a>
            .
          </p>
        </div>
      )}
    </section>
  );
}