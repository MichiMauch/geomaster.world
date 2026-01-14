/**
 * Script to add 29 more emoji country questions (Batch 2)
 *
 * Run with: npx tsx scripts/seed-emoji-quiz-batch2.ts
 */

import { db } from "../lib/db";
import { worldLocations } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

// 29 additional countries (Äthiopien already exists in batch 1)
const EMOJI_QUESTIONS_BATCH2 = [
  // Europa (11 Länder)
  { name: "🐓🌊🍷", countryCode: "pt", lat: 39.3999, lng: -8.2245, nameDe: "Portugal", nameEn: "Portugal", nameSl: "Portugalska", hint: "Hahn von Barcelos, Atlantik, Portwein" },
  { name: "🧛🏰🦇", countryCode: "ro", lat: 45.9432, lng: 24.9668, nameDe: "Rumänien", nameEn: "Romania", nameSl: "Romunija", hint: "Dracula, Schlösser, Fledermäuse" },
  { name: "❄️🧖📱", countryCode: "fi", lat: 61.9241, lng: 25.7482, nameDe: "Finnland", nameEn: "Finland", nameSl: "Finska", hint: "Winter, Sauna, Nokia" },
  { name: "🧱🧜‍♀️🐷", countryCode: "dk", lat: 56.2639, lng: 9.5018, nameDe: "Dänemark", nameEn: "Denmark", nameSl: "Danska", hint: "Lego, Kleine Meerjungfrau, Schweine" },
  { name: "🎻⛷️🍰", countryCode: "at", lat: 47.5162, lng: 14.5501, nameDe: "Österreich", nameEn: "Austria", nameSl: "Avstrija", hint: "Mozart, Skifahren, Sachertorte" },
  { name: "🌋🧊🐳", countryCode: "is", lat: 64.9631, lng: -19.0208, nameDe: "Island", nameEn: "Iceland", nameSl: "Islandija", hint: "Vulkan, Gletscher, Wale" },
  { name: "🥟🦅⛪", countryCode: "pl", lat: 51.9194, lng: 19.1451, nameDe: "Polen", nameEn: "Poland", nameSl: "Poljska", hint: "Pierogi, Adler, Kirchen" },
  { name: "🎰🏎️🛥️", countryCode: "mc", lat: 43.7384, lng: 7.4246, nameDe: "Monaco", nameEn: "Monaco", nameSl: "Monako", hint: "Casino, Formel 1, Jachten" },
  { name: "👨‍🦳🗝️⛪", countryCode: "va", lat: 41.9029, lng: 12.4534, nameDe: "Vatikanstadt", nameEn: "Vatican City", nameSl: "Vatikan", hint: "Papst, Schlüssel Petri, Petersdom" },
  { name: "🧩🌶️🛁", countryCode: "hu", lat: 47.1625, lng: 19.5033, nameDe: "Ungarn", nameEn: "Hungary", nameSl: "Madžarska", hint: "Rubik's Cube, Paprika, Thermalbäder" },
  { name: "🛡️🏦⛰️", countryCode: "li", lat: 47.166, lng: 9.5554, nameDe: "Liechtenstein", nameEn: "Liechtenstein", nameSl: "Lihtenštajn", hint: "Wappen, Banken, Alpen" },

  // Amerika (7 Länder)
  { name: "🚬🚗🍹", countryCode: "cu", lat: 21.5218, lng: -77.7812, nameDe: "Kuba", nameEn: "Cuba", nameSl: "Kuba", hint: "Zigarren, Oldtimer, Mojito" },
  { name: "🏃🎼🏝️", countryCode: "jm", lat: 18.1096, lng: -77.2975, nameDe: "Jamaika", nameEn: "Jamaica", nameSl: "Jamajka", hint: "Sprinten, Reggae, Karibik" },
  { name: "☕💎💐", countryCode: "co", lat: 4.5709, lng: -74.2973, nameDe: "Kolumbien", nameEn: "Colombia", nameSl: "Kolumbija", hint: "Kaffee, Smaragde, Blumen" },
  { name: "🚢👒🌴", countryCode: "pa", lat: 8.538, lng: -80.7821, nameDe: "Panama", nameEn: "Panama", nameSl: "Panama", hint: "Kanal, Panama-Hut, Tropen" },
  { name: "🌶️🍷📏", countryCode: "cl", lat: -35.6751, lng: -71.543, nameDe: "Chile", nameEn: "Chile", nameSl: "Čile", hint: "Chili, Wein, langes Land" },
  { name: "🦥🍍🐸", countryCode: "cr", lat: 9.7489, lng: -83.7534, nameDe: "Costa Rica", nameEn: "Costa Rica", nameSl: "Kostarika", hint: "Faultier, Ananas, Frösche" },
  { name: "🧂🦙🛤️", countryCode: "bo", lat: -16.2902, lng: -63.5887, nameDe: "Bolivien", nameEn: "Bolivia", nameSl: "Bolivija", hint: "Salzwüste, Lama, Todesstraße" },

  // Asien & Naher Osten (7 Länder)
  { name: "🧿🥙🍵", countryCode: "tr", lat: 38.9637, lng: 35.2433, nameDe: "Türkei", nameEn: "Turkey", nameSl: "Turčija", hint: "Nazar-Amulett, Döner, Tee" },
  { name: "🏝️🦎🌋", countryCode: "id", lat: -0.7893, lng: 113.9213, nameDe: "Indonesien", nameEn: "Indonesia", nameSl: "Indonezija", hint: "Inseln, Komodo, Vulkane" },
  { name: "🏙️🦁🎡", countryCode: "sg", lat: 1.3521, lng: 103.8198, nameDe: "Singapur", nameEn: "Singapore", nameSl: "Singapur", hint: "Skyline, Merlion, Riesenrad" },
  { name: "🍡🎤🏝️", countryCode: "ph", lat: 12.8797, lng: 121.774, nameDe: "Philippinen", nameEn: "Philippines", nameSl: "Filipini", hint: "Streetfood, Karaoke, Inseln" },
  { name: "🏔️🚩🎒", countryCode: "np", lat: 28.3949, lng: 84.124, nameDe: "Nepal", nameEn: "Nepal", nameSl: "Nepal", hint: "Everest, Gebetsfahnen, Trekking" },
  { name: "🧆🕎🏖️", countryCode: "il", lat: 31.0461, lng: 34.8516, nameDe: "Israel", nameEn: "Israel", nameSl: "Izrael", hint: "Falafel, Menora, Tel Aviv" },
  { name: "🏛️🐫🌊", countryCode: "jo", lat: 30.5852, lng: 36.2384, nameDe: "Jordanien", nameEn: "Jordan", nameSl: "Jordanija", hint: "Petra, Kamel, Totes Meer" },

  // Afrika (4 Länder)
  { name: "🐒🌳🍦", countryCode: "mg", lat: -18.7669, lng: 46.8691, nameDe: "Madagaskar", nameEn: "Madagascar", nameSl: "Madagaskar", hint: "Lemuren, Baobab, Vanille" },
  { name: "🏜️🏰🍫", countryCode: "gh", lat: 7.9465, lng: -1.0232, nameDe: "Ghana", nameEn: "Ghana", nameSl: "Gana", hint: "Savanne, Forts, Kakao" },
  { name: "🍵🏜️🚪", countryCode: "ma", lat: 31.7917, lng: -7.0926, nameDe: "Marokko", nameEn: "Morocco", nameSl: "Maroko", hint: "Minztee, Sahara, Türen" },
  { name: "🐈🧶🥜", countryCode: "ir", lat: 32.4279, lng: 53.688, nameDe: "Iran", nameEn: "Iran", nameSl: "Iran", hint: "Perserkatze, Teppiche, Pistazien" },
];

async function main() {
  console.log("😀 Adding Emoji Country Quiz Batch 2...\n");

  console.log("🌍 Creating additional emoji questions...");
  let created = 0;
  let skipped = 0;

  for (const question of EMOJI_QUESTIONS_BATCH2) {
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
      console.log(`   ⏭️  ${question.name} -> ${question.nameDe} (exists)`);
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
  console.log(`   📍 Batch 2 total: ${EMOJI_QUESTIONS_BATCH2.length}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
