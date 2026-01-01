import { db } from "../lib/db/index";
import { gameRounds, guesses, users } from "../lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

async function deleteUserRoundGuesses() {
  const gameId = "RsJz9bwYXaFILrohctel6"; // NETNODE Estimation game
  const userName = "Michi Mauch";
  const roundNumber = 3;

  console.log(`=== Lösche Guesses von "${userName}" in Runde ${roundNumber} ===\n`);

  // 1. User finden
  const user = await db
    .select()
    .from(users)
    .where(eq(users.name, userName))
    .get();

  if (!user) {
    console.log(`User "${userName}" nicht gefunden!`);
    return;
  }

  console.log(`User gefunden: ${user.name} (ID: ${user.id})`);

  // 2. Alle gameRounds für Runde 3 in diesem Spiel finden
  const round3Rounds = await db
    .select()
    .from(gameRounds)
    .where(and(eq(gameRounds.gameId, gameId), eq(gameRounds.roundNumber, roundNumber)));

  if (round3Rounds.length === 0) {
    console.log(`Keine Runden für Runde ${roundNumber} gefunden!`);
    return;
  }

  console.log(`${round3Rounds.length} Locations in Runde ${roundNumber} gefunden`);
  const roundIds = round3Rounds.map((r) => r.id);

  // 3. Guesses des Users für diese Runden finden
  const userGuesses = await db
    .select()
    .from(guesses)
    .where(and(eq(guesses.userId, user.id), inArray(guesses.gameRoundId, roundIds)));

  if (userGuesses.length === 0) {
    console.log(`\nKeine Guesses von "${userName}" in Runde ${roundNumber} gefunden!`);
    return;
  }

  console.log(`\n${userGuesses.length} Guesses gefunden:`);
  for (const guess of userGuesses) {
    console.log(`  - ID: ${guess.id}, Distanz: ${guess.distanceKm?.toFixed(2)}km`);
  }

  // 4. Guesses löschen
  console.log(`\nLösche ${userGuesses.length} Guesses...`);

  await db
    .delete(guesses)
    .where(and(eq(guesses.userId, user.id), inArray(guesses.gameRoundId, roundIds)));

  console.log("✓ Guesses gelöscht!");

  // 5. Verifizieren
  const remainingGuesses = await db
    .select()
    .from(guesses)
    .where(and(eq(guesses.userId, user.id), inArray(guesses.gameRoundId, roundIds)));

  console.log(`\nVerifizierung: ${remainingGuesses.length} Guesses verbleibend (sollte 0 sein)`);
  console.log("\n=== Fertig ===");
}

deleteUserRoundGuesses().catch(console.error);
