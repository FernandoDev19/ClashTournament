import { crFetch, normalizeTag, TAG_REGEX } from "@/src/lib/clash";
import { Player } from "@/src/lib/db";
import { NextRequest, NextResponse } from "next/server";

const CR_API_TOKEN = process.env.CR_API_TOKEN ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;

  if (!TAG_REGEX.test(tag)) {
    return NextResponse.json(
      { message: "Tag de Clash Royale inválido" },
      { status: 400 }
    );
  }

  const encodedTag = encodeURIComponent(normalizeTag(tag));

  try {
    const response = await crFetch(`/players/${encodedTag}`)

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            response.message ?? `Error ${response.status} de la API de Clash Royale`,
        },
        { status: response.status }
      );
    }

    const data = response.data as Omit<Player, "arena"> & {
      arena: { id: number; name: string, icon: string };
    };

    // Retornamos solo los campos relevantes
    return NextResponse.json({
      tag: data.tag,
      name: data.name,
      trophies: data.trophies,
      bestTrophies: data.bestTrophies,
      expLevel: data.expLevel,
      clan: data.clan
        ? { name: data.clan.name, tag: data.clan.tag }
        : null,
      arena: data.arena?.name ?? null,
    });
  } catch {
    return NextResponse.json(
      { message: "Error al conectar con la API de Clash Royale" },
      { status: 500 }
    );
  }
}
