import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, safeEqual, SESSION_COOKIE } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ success: false, message: "Servidor mal configurado" }, { status: 500 });
  }

  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ success: false, message: "Contraseña incorrecta" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}

export async function DELETE() { // logout
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
} 