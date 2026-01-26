/**
 * Fix James Bond 007 Quiz Format
 *
 * Transforms the name format from:
 *   "briefing <br> location_name - film"
 * To:
 *   "film <br> briefing <br> location_name"
 *
 * Usage: source <(grep -E "^TURSO_" .env.local | sed 's/^/export /') && npx tsx scripts/fix-james-bond-format.ts
 */

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

function transformName(oldName: string): string | null {
  // Current format (with <br> tags): "film <br> briefing <br> location_name"
  // New format (with newlines): "film\nbriefing\nlocation_name"

  const brMatch = oldName.match(/^(.+?) <br> (.+?) <br> (.+)$/);
  if (!brMatch) {
    return null;
  }

  const film = brMatch[1];
  const briefing = brMatch[2];
  const locationName = brMatch[3];

  return `${film}\n${briefing}\n${locationName}`;
}

async function main() {
  console.log("🎬 Fixing James Bond 007 Quiz format...\n");

  // Read all James Bond locations
  const result = await client.execute({
    sql: `SELECT id, name FROM worldLocations WHERE category = 'james-bond-007'`,
    args: [],
  });

  console.log(`Found ${result.rows.length} locations\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of result.rows) {
    const id = row.id as string;
    const oldName = row.name as string;

    // Check if already in new format (has two newlines, no <br> tags)
    if ((oldName.match(/\n/g) || []).length === 2 && !oldName.includes("<br>")) {
      skipped++;
      continue;
    }

    const newName = transformName(oldName);

    if (!newName) {
      console.error(`Could not parse: ${oldName}`);
      errors++;
      continue;
    }

    try {
      await client.execute({
        sql: `UPDATE worldLocations SET name = ?, name_de = ? WHERE id = ?`,
        args: [newName, newName, id],
      });
      updated++;
      process.stdout.write(`\r  Updated: ${updated}`);
    } catch (error) {
      console.error(`\nError updating ${id}:`, error);
      errors++;
    }
  }

  console.log(`\n\n✓ Format fix complete!`);
  console.log(`  - Updated: ${updated}`);
  console.log(`  - Skipped (already new format): ${skipped}`);
  console.log(`  - Errors: ${errors}`);
}

main().catch(console.error);
