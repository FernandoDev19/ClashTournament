// src/components/ThemeProvider.tsx (o donde guardes tus componentes)
"use client";

import { ThemeProvider } from "@material-tailwind/react";

export function MTProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}