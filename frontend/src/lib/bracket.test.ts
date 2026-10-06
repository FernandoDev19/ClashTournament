import { describe, it, expect } from "vitest";
import { generateBracket } from "./db";
import type { Player } from "./db";
import { propagateWinner } from "./bracket";

const mk = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`, tag: `#T${i + 1}`, name: `P${i + 1}`,
    trophies: 10000 - i * 100, bestTrophies: 0, expLevel: 1,
    clan: null, arena: null, contact: "x", status: "accepted",
    registeredAt: "", wins: 0, losses: 0,
  }));

describe("generateBracket", () => {
  it.each([2, 3, 5, 8, 11, 16])("%i jugadores: todos entran una sola vez", (n) => {
    const b = generateBracket(mk(n))!;
    const slots = 2 ** Math.ceil(Math.log2(n));
    expect(b.rounds[0].matches).toHaveLength(slots / 2);
    expect(b.rounds.at(-1)!.matches).toHaveLength(1);

    const ids = b.rounds[0].matches
      .flatMap((m) => [m.player1?.id, m.player2?.id])
      .filter(Boolean);
    expect(ids).toHaveLength(n);
    expect(new Set(ids).size).toBe(n);
  });

  it("seed 1 y seed 2 quedan en mitades opuestas", () => {
    const b = generateBracket(mk(8))!;
    const idx = (id: string) =>
      b.rounds[0].matches.findIndex((m) => m.player1?.id === id || m.player2?.id === id);
    expect(idx("p1")).toBeLessThan(2);
    expect(idx("p2")).toBeGreaterThanOrEqual(2);
  });

  it("crea partido de 3er puesto si se pide", () => {
    expect(generateBracket(mk(8), true)!.thirdPlaceMatch).not.toBeNull();
    expect(generateBracket(mk(8))!.thirdPlaceMatch).toBeNull();
  });
});

describe("propagateWinner", () => {
  it("cambiar el ganador limpia el partido siguiente", () => {
    const b = generateBracket(mk(4), true)!;

    b.rounds[0].matches[0].winner = "p1";
    propagateWinner(b, 0, 0);
    expect(b.rounds[1].matches[0].player1?.id).toBe("p1");
    expect(b.thirdPlaceMatch!.player1?.id).toBe("p4");

    b.rounds[1].matches[0].winner = "p1"; // resultado dependiente

    b.rounds[0].matches[0].winner = "p4"; // se corrige el resultado
    propagateWinner(b, 0, 0);
    expect(b.rounds[1].matches[0].player1?.id).toBe("p4");
    expect(b.rounds[1].matches[0].winner).toBeNull();
  });
});