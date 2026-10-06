import type { Match, Tournament } from "./db";

type Bracket = NonNullable<Tournament["bracket"]>;

function clearMatch(m: Match) {
  m.winner = null;
  m.score1 = null;
  m.score2 = null;
  m.deck1 = null;
  m.deck2 = null;
  m.battleTime = null;
  m.autoValidated = false;
}

/**
 * Propaga el ganador de rounds[rIdx].matches[mIdx] a la siguiente ronda
 * y manda al perdedor al 3er puesto si es semifinal.
 * Si el jugador de la siguiente ronda cambia, limpia ese partido y sus dependientes.
 */
export function propagateWinner(bracket: Bracket, rIdx: number, mIdx: number) {
  const match = bracket.rounds[rIdx].matches[mIdx];

  const winnerPlayer = !match.winner
    ? null
    : match.player1?.id === match.winner
      ? match.player1
      : match.player2?.id === match.winner
        ? match.player2
        : null;

  const loserPlayer = !winnerPlayer
    ? null
    : winnerPlayer.id === match.player1?.id
      ? match.player2
      : match.player1;

  const slot: "player1" | "player2" = mIdx % 2 === 0 ? "player1" : "player2";

  // Siguiente ronda
  const nextIdx = Math.floor(mIdx / 2);
  const nextMatch = bracket.rounds[rIdx + 1]?.matches[nextIdx];
  if (nextMatch && nextMatch[slot]?.id !== winnerPlayer?.id) {
    nextMatch[slot] = winnerPlayer;
    clearMatch(nextMatch); // el resultado anterior ya no es válido
    propagateWinner(bracket, rIdx + 1, nextIdx); // limpia en cascada
  }

  // Tercer puesto (perdedor de semifinal)
  const isSemifinal = rIdx === bracket.rounds.length - 2;
  const tp = bracket.thirdPlaceMatch;
  if (isSemifinal && tp && tp[slot]?.id !== loserPlayer?.id) {
    tp[slot] = loserPlayer;
    clearMatch(tp);
  }
}