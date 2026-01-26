import { db } from "../lib/db/index";
import { users, rankedGameResults, rankings, duelResults, duelStats } from "../lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { RankingService } from "../lib/services/ranking/ranking-service";

async function removeRankedUsers() {
  // Step 1: Find the users "Michi M." and "Guesser"
  const allUsers = await db.select({ id: users.id, name: users.name, nickname: users.nickname, email: users.email }).from(users);

  const targetUsers = allUsers.filter((u) => {
    const name = (u.name || "").toLowerCase();
    const nickname = (u.nickname || "").toLowerCase();
    return name.includes("michi") || nickname.includes("michi") || name === "guesser" || nickname === "guesser";
  });

  if (targetUsers.length === 0) {
    console.log("No matching users found. Aborting.");
    return;
  }

  console.log("\n=== Users to remove from ranked leaderboards ===");
  for (const u of targetUsers) {
    console.log(`  ID: ${u.id} | Name: ${u.name} | Nickname: ${u.nickname} | Email: ${u.email}`);
  }

  const userIds = targetUsers.map((u) => u.id);
  console.log(`\nUser IDs: ${userIds.join(", ")}`);

  // Step 2: Delete data from tables
  console.log("\n=== Deleting data ===");

  // 2a: duelResults (where challengerId OR accepterId matches)
  let duelResultsDeleted = 0;
  for (const userId of userIds) {
    const result = await db
      .delete(duelResults)
      .where(or(eq(duelResults.challengerId, userId), eq(duelResults.accepterId, userId)));
    const count = (result as unknown as { rowsAffected: number }).rowsAffected ?? 0;
    duelResultsDeleted += count;
  }
  console.log(`  duelResults: ${duelResultsDeleted} rows deleted`);

  // 2b: duelStats (where userId matches)
  let duelStatsDeleted = 0;
  for (const userId of userIds) {
    const result = await db.delete(duelStats).where(eq(duelStats.userId, userId));
    const count = (result as unknown as { rowsAffected: number }).rowsAffected ?? 0;
    duelStatsDeleted += count;
  }
  console.log(`  duelStats: ${duelStatsDeleted} rows deleted`);

  // 2c: rankedGameResults (where userId matches)
  let rankedResultsDeleted = 0;
  for (const userId of userIds) {
    const result = await db.delete(rankedGameResults).where(eq(rankedGameResults.userId, userId));
    const count = (result as unknown as { rowsAffected: number }).rowsAffected ?? 0;
    rankedResultsDeleted += count;
  }
  console.log(`  rankedGameResults: ${rankedResultsDeleted} rows deleted`);

  // 2d: rankings (where userId matches)
  let rankingsDeleted = 0;
  for (const userId of userIds) {
    const result = await db.delete(rankings).where(eq(rankings.userId, userId));
    const count = (result as unknown as { rowsAffected: number }).rowsAffected ?? 0;
    rankingsDeleted += count;
  }
  console.log(`  rankings: ${rankingsDeleted} rows deleted`);

  // Step 3: Recalculate ranks for all remaining ranking entries
  console.log("\n=== Recalculating ranks ===");

  const distinctCombinations = await db
    .selectDistinct({
      gameType: rankings.gameType,
      period: rankings.period,
      periodKey: rankings.periodKey,
    })
    .from(rankings);

  console.log(`  Found ${distinctCombinations.length} distinct (gameType, period, periodKey) combinations`);

  for (const combo of distinctCombinations) {
    await RankingService.recalculateRanks(
      combo.gameType,
      combo.period as "daily" | "weekly" | "monthly" | "alltime",
      combo.periodKey
    );
  }
  console.log("  Ranking recalculation complete.");

  // Step 4: Recalculate duel ranks
  console.log("\n=== Recalculating duel ranks ===");

  const distinctDuelGameTypes = await db
    .selectDistinct({ gameType: duelStats.gameType })
    .from(duelStats);

  console.log(`  Found ${distinctDuelGameTypes.length} distinct duel game types`);

  for (const { gameType } of distinctDuelGameTypes) {
    // Get all duel stats for this game type, ordered by wins desc, winRate desc, totalDuels desc
    const allStats = await db
      .select()
      .from(duelStats)
      .where(eq(duelStats.gameType, gameType))
      .orderBy(sql`${duelStats.wins} DESC, ${duelStats.winRate} DESC, ${duelStats.totalDuels} DESC`);

    for (let i = 0; i < allStats.length; i++) {
      await db
        .update(duelStats)
        .set({ rank: i + 1 })
        .where(eq(duelStats.id, allStats[i].id));
    }
    console.log(`  ${gameType}: ${allStats.length} entries re-ranked`);
  }

  // Summary
  console.log("\n=== Summary ===");
  console.log(`  duelResults deleted: ${duelResultsDeleted}`);
  console.log(`  duelStats deleted: ${duelStatsDeleted}`);
  console.log(`  rankedGameResults deleted: ${rankedResultsDeleted}`);
  console.log(`  rankings deleted: ${rankingsDeleted}`);
  console.log(`  Ranking combinations recalculated: ${distinctCombinations.length}`);
  console.log(`  Duel game types re-ranked: ${distinctDuelGameTypes.length}`);
  console.log("\nDone! Users remain in the users table but are removed from all leaderboards.");
}

removeRankedUsers().catch(console.error);
