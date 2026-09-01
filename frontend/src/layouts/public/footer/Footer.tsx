"use client";

import { Typography } from "@material-tailwind/react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary border-t border-neutral/30 p-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <Image src="/logo-l-white.svg" alt="Logo" width={200} height={50} />

        <div className="flex items-center gap-6">
          <Link href="#" title="Discord" target="_blank">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-normal text-neutral hover:text-secondary transition-colors duration-300 ease"
            >
              Discord
            </Typography>
          </Link>

          <Link href="#" title="TikTok" target="_blank">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-normal text-neutral hover:text-secondary transition-colors duration-300 ease"
            >
              TikTok
            </Typography>
          </Link>
        </div>

        <Typography
          variant="small"
          color="blue-gray"
          className="font-normal text-neutral"
        >
          Todos los derechos reservados © 2026
        </Typography>

      </div>
    </footer>
  );
}
