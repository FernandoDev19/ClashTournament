import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET ?? "";

const sign = (v: string) => createHmac("sha256", SECRET).update(v).digest("hex");

export function createSessionToken(ttlMs = 8 * 60 * 60 * 1000) {
  const exp = String(Date.now() + ttlMs);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token || !SECRET) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(exp) > Date.now();
}

export function isAdminRequest(req: NextRequest) {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

// Comparación en tiempo constante para la contraseña
export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}