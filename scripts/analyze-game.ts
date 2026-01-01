import { db } from "../lib/db/index";
import { games, gameRounds, guesses, users } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

async function analyzeGame() {
  const gameId = "RsJz9bwYXaFILrohctel6"; // NETNODE Estimation game
  const userEmail = "michi.mauch@netnode.ch";

  console.log("=== GAME ANALYSIS ===\n");

  // Get game info
  const game = await db.select().from(games).where(eq(games.id, gameId)).get();
  console.log("Game:", {
    id: game?.id,
    currentRound: game?.currentRound,
    gameType: game?.gameType,
    country: game?.country,
  });

  // Get user
  const user = await db.select().from(users).where(eq(users.email, userEmail)).get();
  console.log("\nUser:", { id: user?.id, email: user?.email, name: user?.name });

  if (!user) {
    console.log("User not found!");
    return;
  }

  // Get all rounds for this game
  const allRounds = await db
    .select()
    .from(gameRounds)
    .where(eq(gameRounds.gameId, gameId))
    .orderBy(gameRounds.roundNumber, gameRounds.locationIndex);

  console.log(`\n=== ALL ROUNDS (${allRounds.length} total) ===`);

  // Group by roundNumber
  const roundsByNumber = new Map<number, typeof allRounds>();
  for (const round of allRounds) {
    if (!roundsByNumber.has(round.roundNumber)) {
      roundsByNumber.set(round.roundNumber, []);
    }
    roundsByNumber.get(round.roundNumber)!.push(round);
  }

  for (const [roundNum, rounds] of roundsByNumber) {
    console.log(`\nRound ${roundNum} (${rounds.length} locations):`);
    for (const r of rounds) {
      console.log(`  - ${r.id}: locationIndex=${r.locationIndex}, gameType=${r.gameType}, country=${r.country}`);
    }
  }

  // Get all guesses for this user in this game
  const roundIds = allRounds.map(r => r.id);
  const userGuesses = await db
    .select()
    .from(guesses)
    .where(eq(guesses.userId, user.id));

  // Filter to only guesses for this game
  const gameGuesses = userGuesses.filter(g => roundIds.includes(g.gameRoundId));

  console.log(`\n=== USER GUESSES (${gameGuesses.length} total) ===`);

  const guessedRoundIds = new Set(gameGuesses.map(g => g.gameRoundId));

  // Show which rounds user has played
  for (const [roundNum, rounds] of roundsByNumber) {
    const playedCount = rounds.filter(r => guessedRoundIds.has(r.id)).length;
    const totalCount = rounds.length;
    console.log(`Round ${roundNum}: ${playedCount}/${totalCount} played`);

    if (playedCount < totalCount) {
      console.log("  Missing:");
      for (const r of rounds) {
        if (!guessedRoundIds.has(r.id)) {
          console.log(`    - ${r.id} (locationIndex=${r.locationIndex})`);
        }
      }
    }
  }

  // Simulate frontend logic
  console.log("\n=== FRONTEND LOGIC SIMULATION ===");

  const releasedRounds = allRounds.filter(r => r.roundNumber <= (game?.currentRound || 0));
  console.log(`Released rounds: ${releasedRounds.length} (currentRound=${game?.currentRound})`);

  const nextUnplayed = releasedRounds.findIndex(r => !guessedRoundIds.has(r.id));
  console.log(`nextUnplayed index: ${nextUnplayed}`);

  if (nextUnplayed >= 0) {
    const currentRound = releasedRounds[nextUnplayed];
    console.log(`currentRound:`, {
      id: currentRound.id,
      roundNumber: currentRound.roundNumber,
      locationIndex: currentRound.locationIndex,
      gameType: currentRound.gameType,
      country: currentRound.country,
    });
  } else {
    console.log("All released rounds played! Should redirect to group page.");
  }

  console.log("\n=== END ANALYSIS ===");
}

analyzeGame().catch(console.error);
