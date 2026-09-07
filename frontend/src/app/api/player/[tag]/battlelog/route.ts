import { NextRequest, NextResponse } from "next/server";

const CR_API_TOKEN = process.env.CR_API_TOKEN ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;

  const encodedTag = encodeURIComponent(
    tag.startsWith("#") ? tag : `#${tag}`
  );

  const url = `https://api.clashroyale.com/v1/players/${encodedTag}/battlelog`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CR_API_TOKEN}`,
        "Content-Type": "application/json",
      },
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

    // Map battlelog into clean structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battles = data.map((b: any) => {
      const teamPlayer = b.team?.[0];
      const opponentPlayer = b.opponent?.[0];

      return {
        type: b.type ?? "battle",
        battleTime: b.battleTime,
        team: teamPlayer
          ? {
              tag: teamPlayer.tag,
              name: teamPlayer.name,
              crowns: teamPlayer.crowns ?? 0,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cards: (teamPlayer.cards || []).map((c: any) => ({
                name: c.name,
                level: c.level,
                maxLevel: c.maxLevel,
                iconUrl: c.iconUrls?.medium || c.iconUrls?.evoMedium || "",
              })),
            }
          : null,
        opponent: opponentPlayer
          ? {
              tag: opponentPlayer.tag,
              name: opponentPlayer.name,
              crowns: opponentPlayer.crowns ?? 0,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cards: (opponentPlayer.cards || []).map((c: any) => ({
                name: c.name,
                level: c.level,
                maxLevel: c.maxLevel,
                iconUrl: c.iconUrls?.medium || c.iconUrls?.evoMedium || "",
              })),
            }
          : null,
      };
    });

    return NextResponse.json({ battles });
  } catch {
    return NextResponse.json(
      { message: "Error al conectar con la API de Clash Royale" },
      { status: 500 }
    );
  }
}
