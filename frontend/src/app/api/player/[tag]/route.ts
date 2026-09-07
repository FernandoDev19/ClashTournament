import { NextRequest, NextResponse } from "next/server";

const CR_API_TOKEN = process.env.CR_API_TOKEN ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;

  // El tag puede llegar con o sin #; la API requiere %23 en lugar de #
  const encodedTag = encodeURIComponent(
    tag.startsWith("#") ? tag : `#${tag}`
  );

  const url = `https://proxy.royaleapi.dev/v1/players/${encodedTag}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CR_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      // No cachear: necesitamos datos frescos del jugador
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message:
            error?.message ?? `Error ${response.status} de la API de Clash Royale`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

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
