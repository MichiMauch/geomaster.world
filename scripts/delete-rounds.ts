import { db } from "../lib/db/index";
import { games, gameRounds, guesses } from "../lib/db/schema";
import { eq, and, gte, inArray } from "drizzle-orm";

async function deleteRounds() {
  const gameId = "RsJz9bwYXaFILrohctel6"; // NETNODE Estimation game
  const minRound = 3;

  console.log(`Deleting rounds >= ${minRound} for game ${gameId}...`);

  // First, get all round IDs to delete
  const roundsToDelete = await db
    .select({ id: gameRounds.id, roundNumber: gameRounds.roundNumber })
    .from(gameRounds)
    .where(and(eq(gameRounds.gameId, gameId), gte(gameRounds.roundNumber, minRound)));

  console.log(`Found ${roundsToDelete.length} rounds to delete:`, roundsToDelete);

  if (roundsToDelete.length > 0) {
    const roundIds = roundsToDelete.map((r) => r.id);

    // Delete guesses for these rounds
    const deletedGuesses = await db
      .delete(guesses)
      .where(inArray(guesses.gameRoundId, roundIds));
    console.log("Deleted guesses");

    // Delete the rounds
    const deletedRounds = await db
      .delete(gameRounds)
      .where(inArray(gameRounds.id, roundIds));
    console.log("Deleted rounds");
  }

  // Update game to set currentRound = 2
  await db
    .update(games)
    .set({ currentRound: 2 })
    .where(eq(games.id, gameId));
  console.log("Updated game currentRound to 2");

  // Verify
  const game = await db.select().from(games).where(eq(games.id, gameId));
  console.log("Game after update:", game[0]);

  const remainingRounds = await db
    .select()
    .from(gameRounds)
    .where(eq(gameRounds.gameId, gameId));
  console.log(`Remaining rounds: ${remainingRounds.length}`);

  console.log("Done!");
}

deleteRounds().catch(console.error);
