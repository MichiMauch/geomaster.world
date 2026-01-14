/**
 * Script to seed emoji country quiz
 *
 * Players must guess which country is represented by 3 emojis.
 * Example: 🥐🍷🗼 -> France (Croissant, Wine, Eiffel Tower)
 *
 * Run with: npx tsx scripts/seed-emoji-quiz.ts
 */

import { db } from "../lib/db";
import { worldQuizTypes, worldLocations } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

// Quiz type configuration
const EMOJI_QUIZ_TYPE = {
  id: "emoji-countries",
  name: "Emoji-Länder",
  nameEn: "Emoji Countries",
  nameSl: "Emoji države",
  icon: "😀",
  centerLat: 20,
  centerLng: 0,
  defaultZoom: 2,
  minZoom: 1,
  timeoutPenalty: 5000,
  scoreScaleFactor: 3000,
  isActive: true,
  createdAt: new Date(),
};

// 30 countries with their emoji representations
const EMOJI_QUESTIONS = [
  // Europa
  { name: "🥐🍷🗼", countryCode: "fr", lat: 46.2276, lng: 2.2137, nameDe: "Frankreich", nameEn: "France", nameSl: "Francija", hint: "Croissant, Wein, Eiffelturm" },
  { name: "🍕🍝🛵", countryCode: "it", lat: 41.8719, lng: 12.5674, nameDe: "Italien", nameEn: "Italy", nameSl: "Italija", hint: "Pizza, Pasta, Vespa" },
  { name: "🍺🥨🚗", countryCode: "de", lat: 51.1657, lng: 10.4515, nameDe: "Deutschland", nameEn: "Germany", nameSl: "Nemčija", hint: "Bier, Brezel, Autos" },
  { name: "☕🌧️👑", countryCode: "gb", lat: 55.3781, lng: -3.4360, nameDe: "Großbritannien", nameEn: "United Kingdom", nameSl: "Združeno kraljestvo", hint: "Tee, Regen, Royals" },
  { name: "🧀🍫🏔️", countryCode: "ch", lat: 46.8182, lng: 8.2275, nameDe: "Schweiz", nameEn: "Switzerland", nameSl: "Švica", hint: "Käse, Schokolade, Berge" },
  { name: "🌷🚲🛶", countryCode: "nl", lat: 52.1326, lng: 5.2913, nameDe: "Niederlande", nameEn: "Netherlands", nameSl: "Nizozemska", hint: "Tulpen, Fahrräder, Grachten" },
  { name: "🥘💃🐂", countryCode: "es", lat: 40.4637, lng: -3.7492, nameDe: "Spanien", nameEn: "Spain", nameSl: "Španija", hint: "Paella, Flamenco, Stier" },
  { name: "☘️🎻🍺", countryCode: "ie", lat: 53.1424, lng: -7.6921, nameDe: "Irland", nameEn: "Ireland", nameSl: "Irska", hint: "Kleeblatt, Musik, Guinness" },
  { name: "🏛️🥗🏺", countryCode: "gr", lat: 39.0742, lng: 21.8243, nameDe: "Griechenland", nameEn: "Greece", nameSl: "Grčija", hint: "Tempel, Salat, Antike" },
  { name: "🐻🪆❄️", countryCode: "ru", lat: 61.5240, lng: 105.3188, nameDe: "Russland", nameEn: "Russia", nameSl: "Rusija", hint: "Bär, Matroschka, Kälte" },
  { name: "🍫🍟🧇", countryCode: "be", lat: 50.5039, lng: 4.4699, nameDe: "Belgien", nameEn: "Belgium", nameSl: "Belgija", hint: "Schokolade, Pommes, Waffeln" },
  { name: "🌲🦌🐟", countryCode: "se", lat: 60.1282, lng: 18.6435, nameDe: "Schweden", nameEn: "Sweden", nameSl: "Švedska", hint: "Wald, Elch, Fisch" },

  // Amerika
  { name: "🍔🗽🦅", countryCode: "us", lat: 37.0902, lng: -95.7129, nameDe: "USA", nameEn: "United States", nameSl: "ZDA", hint: "Burger, Freiheitsstatue, Adler" },
  { name: "🍁🥞🏒", countryCode: "ca", lat: 56.1304, lng: -106.3468, nameDe: "Kanada", nameEn: "Canada", nameSl: "Kanada", hint: "Ahornblatt, Pancakes, Eishockey" },
  { name: "🌮🌵🎸", countryCode: "mx", lat: 23.6345, lng: -102.5528, nameDe: "Mexiko", nameEn: "Mexico", nameSl: "Mehika", hint: "Tacos, Kaktus, Mariachi" },
  { name: "⚽🏖️🦜", countryCode: "br", lat: -14.2350, lng: -51.9253, nameDe: "Brasilien", nameEn: "Brazil", nameSl: "Brazilija", hint: "Fußball, Strand, Papagei" },
  { name: "🥩🍷🧉", countryCode: "ar", lat: -38.4161, lng: -63.6167, nameDe: "Argentinien", nameEn: "Argentina", nameSl: "Argentina", hint: "Steak, Wein, Mate-Tee" },
  { name: "🦙🌽⛰️", countryCode: "pe", lat: -9.1900, lng: -75.0152, nameDe: "Peru", nameEn: "Peru", nameSl: "Peru", hint: "Lama, Mais, Anden" },

  // Asien
  { name: "🍣🗻🌸", countryCode: "jp", lat: 36.2048, lng: 138.2529, nameDe: "Japan", nameEn: "Japan", nameSl: "Japonska", hint: "Sushi, Fuji, Kirschblüte" },
  { name: "🐼🐉🥢", countryCode: "cn", lat: 35.8617, lng: 104.1954, nameDe: "China", nameEn: "China", nameSl: "Kitajska", hint: "Panda, Drache, Stäbchen" },
  { name: "🍛🐘🕉️", countryCode: "in", lat: 20.5937, lng: 78.9629, nameDe: "Indien", nameEn: "India", nameSl: "Indija", hint: "Curry, Elefant, Religion" },
  { name: "🐘🥊🥭", countryCode: "th", lat: 15.8700, lng: 100.9925, nameDe: "Thailand", nameEn: "Thailand", nameSl: "Tajska", hint: "Elefant, Thai-Boxen, Mango" },
  { name: "🥬🎤📱", countryCode: "kr", lat: 35.9078, lng: 127.7669, nameDe: "Südkorea", nameEn: "South Korea", nameSl: "Južna Koreja", hint: "Kimchi, K-Pop, Technik" },
  { name: "☕🛵🍜", countryCode: "vn", lat: 14.0583, lng: 108.2772, nameDe: "Vietnam", nameEn: "Vietnam", nameSl: "Vietnam", hint: "Kaffee, Mopeds, Pho" },
  { name: "🛢️🌴🕌", countryCode: "sa", lat: 23.8859, lng: 45.0792, nameDe: "Saudi-Arabien", nameEn: "Saudi Arabia", nameSl: "Saudova Arabija", hint: "Öl, Palmen, Moschee" },

  // Afrika & Ozeanien
  { name: "🐪🏜️📐", countryCode: "eg", lat: 26.8206, lng: 30.8025, nameDe: "Ägypten", nameEn: "Egypt", nameSl: "Egipt", hint: "Kamel, Wüste, Pyramide" },
  { name: "🦁💎🏉", countryCode: "za", lat: -30.5595, lng: 22.9375, nameDe: "Südafrika", nameEn: "South Africa", nameSl: "Južna Afrika", hint: "Löwen, Diamanten, Rugby" },
  { name: "🏃☕🦁", countryCode: "et", lat: 9.145, lng: 40.4897, nameDe: "Äthiopien", nameEn: "Ethiopia", nameSl: "Etiopija", hint: "Läufer, Kaffee, Löwen" },
  { name: "🦘🐨🏄", countryCode: "au", lat: -25.2744, lng: 133.7751, nameDe: "Australien", nameEn: "Australia", nameSl: "Avstralija", hint: "Känguru, Koala, Surfen" },
  { name: "🥝🐑🏉", countryCode: "nz", lat: -40.9006, lng: 174.886, nameDe: "Neuseeland", nameEn: "New Zealand", nameSl: "Nova Zelandija", hint: "Kiwi, Schafe, Rugby" },
];

async function main() {
  console.log("😀 Seeding Emoji Country Quiz...\n");

  // 1. Create quiz type
  console.log("📝 Creating quiz type...");
  const existingType = await db
    .select()
    .from(worldQuizTypes)
    .where(eq(worldQuizTypes.id, EMOJI_QUIZ_TYPE.id));

  if (existingType.length > 0) {
    console.log(`   ⏭️  Quiz type "${EMOJI_QUIZ_TYPE.id}" already exists, skipping`);
  } else {
    await db.insert(worldQuizTypes).values(EMOJI_QUIZ_TYPE);
    console.log(`   ✅ Created quiz type "${EMOJI_QUIZ_TYPE.name}" (${EMOJI_QUIZ_TYPE.icon})`);
  }

  // 2. Create questions
  console.log("\n🌍 Creating emoji questions...");
  let created = 0;
  let skipped = 0;

  for (const question of EMOJI_QUESTIONS) {
    // Check if already exists
    const existing = await db
      .select()
      .from(worldLocations)
      .where(
        and(
          eq(worldLocations.category, "emoji-countries"),
          eq(worldLocations.name, question.name)
        )
      );

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.insert(worldLocations).values({
      category: "emoji-countries",
      name: question.name,
      nameDe: question.nameDe,
      nameEn: question.nameEn,
      nameSl: question.nameSl,
      latitude: question.lat,
      longitude: question.lng,
      countryCode: question.countryCode,
      additionalInfo: JSON.stringify({ hint: question.hint }),
      difficulty: "medium",
      createdAt: new Date(),
    });
    created++;
    console.log(`   ✅ ${question.name} -> ${question.nameDe}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📍 Total questions: ${EMOJI_QUESTIONS.length}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
