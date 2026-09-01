"use client";

import {
  Button,
  Collapse,
  Navbar,
  Typography,
} from "@material-tailwind/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const [openNav, setOpenNav] = useState(false);
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
       function handleResize() {
      if (window.innerWidth >= 768) {
        setOpenNav(false);
        setIsMobile(false);
      } else {
        setIsMobile(true);
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  console.log(isMobile)

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 md:flex-row lg:items-center lg:gap-6">
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link
          href="/"
          className={`flex items-center ${pathname === "/" ? "text-secondary font-bold" : "text-neutral hover:text-secondary"} transition-all duration-300 ease`}
        >
          Inicio
        </Link>
        <hr className={`${pathname === "/" ? "border-secondary" : "hidden"}`} />
      </Typography>

      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link
          href="/players"
          className={`flex items-center ${pathname === "/players" ? "text-secondary font-bold" : "text-neutral hover:text-secondary"} transition-all duration-300 ease`}
        >
          Jugadores
        </Link>
        <hr
          className={`${pathname === "/players" ? "border-secondary" : "hidden"}`}
        />
      </Typography>

      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link
          href="/brackets"
          className={`flex items-center ${pathname === "/brackets" ? "text-secondary font-bold" : "text-neutral hover:text-secondary"} transition-all duration-300 ease`}
        >
          Enfrentamientos
        </Link>
        <hr
          className={`${pathname === "/brackets" ? "border-secondary" : "hidden"}`}
        />
      </Typography>

      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link
          href="/admin"
          className={`flex items-center ${pathname === "/admin" ? "text-secondary font-bold" : "text-neutral hover:text-secondary"} transition-all duration-300 ease`}
        >
          Admin
        </Link>
        <hr
          className={`${pathname === "/admin" ? "border-secondary" : "hidden"}`}
        />
      </Typography>
    </ul>
  );

  return (
    <header className="sticky top-0 z-1000">
      <Navbar className="shadow-lg shadow-secondary/25 bg-primary h-max max-w-full border-none rounded-none px-4 py-2 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between text-blue-gray-900">
          <div className={`${!isMobile ? "w-1/3" : "w-full"}`}>
            <Link href="/" className="flex items-center gap-3" title="Home">
              <Image src="/favicon.ico" alt="Logo" width={50} height={50} />
              <Typography variant="h5" className="text-secondary font-extrabold">
                Torneo Clash Royale
              </Typography>
            </Link>
          </div>

          <div
            className={`w-1/3 ${!isMobile ? "flex justify-center" : "hidden"}`}
          >
            {navList}
          </div>

          <div className="flex items-center justify-end gap-4 w-1/3">
            <Link
              href="/register"
              className={`${!isMobile ? "flex" : "hidden"}`}
            >
              <Button
                size="sm"
                className="bg-secondary text-white rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors duration-300 ease"
              >
                <span>Registrarse</span>
              </Button>
            </Link>

            <button
              className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent md:hidden"
              onClick={() => setOpenNav(!openNav)}
            >
              {openNav ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <Collapse open={openNav}>
          <div className={`${openNav ? "flex py-4" : "hidden"} flex-col`}>
            {navList}
            <div className="flex items-center gap-x-1">
              <Link href="/register">
                <Button
                  fullWidth
                  size="sm"
                  className="bg-secondary text-white rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors duration-300 ease"
                >
                  <span>Registrarse</span>
                </Button>
              </Link>
            </div>
          </div>
        </Collapse>
      </Navbar>
    </header>
  );
}
