const TOKEN = process.env.CR_API_TOKEN ?? "";
const BASE = "https://proxy.royaleapi.dev/v1";

export const TAG_REGEX = /^#?[0289PYLQGRJCUV]{3,15}$/i; // alfabeto válido de tags de CR

export const normalizeTag = (t: string) => (t.startsWith("#") ? t : `#${t}`).toUpperCase();

export async function crFetch<T>(path: string): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, message: err?.message ?? `Error ${res.status}` };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, status: 502, message: "No se pudo conectar con la API de Clash Royale" };
  }
}