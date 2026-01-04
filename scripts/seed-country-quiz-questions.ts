/**
 * Script to seed country quiz questions into worldLocations table
 *
 * For country quizzes:
 * - "name" field contains the question content (flag emoji or place name)
 * - "countryCode" is the correct answer (ISO 2-letter code, lowercase)
 * - latitude/longitude are set to country center (for fallback distance calculation)
 *
 * Run with: npx tsx scripts/seed-country-quiz-questions.ts
 */

import { db } from "../lib/db";
import { worldLocations } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

// Flags with their country codes and approximate center coordinates
const FLAG_QUESTIONS = [
  // Europe
  { name: "🇨🇭", countryCode: "ch", lat: 46.8182, lng: 8.2275, nameDe: "Schweiz", nameEn: "Switzerland", nameSl: "Švica" },
  { name: "🇩🇪", countryCode: "de", lat: 51.1657, lng: 10.4515, nameDe: "Deutschland", nameEn: "Germany", nameSl: "Nemčija" },
  { name: "🇫🇷", countryCode: "fr", lat: 46.2276, lng: 2.2137, nameDe: "Frankreich", nameEn: "France", nameSl: "Francija" },
  { name: "🇮🇹", countryCode: "it", lat: 41.8719, lng: 12.5674, nameDe: "Italien", nameEn: "Italy", nameSl: "Italija" },
  { name: "🇦🇹", countryCode: "at", lat: 47.5162, lng: 14.5501, nameDe: "Österreich", nameEn: "Austria", nameSl: "Avstrija" },
  { name: "🇪🇸", countryCode: "es", lat: 40.4637, lng: -3.7492, nameDe: "Spanien", nameEn: "Spain", nameSl: "Španija" },
  { name: "🇵🇹", countryCode: "pt", lat: 39.3999, lng: -8.2245, nameDe: "Portugal", nameEn: "Portugal", nameSl: "Portugalska" },
  { name: "🇬🇧", countryCode: "gb", lat: 55.3781, lng: -3.4360, nameDe: "Vereinigtes Königreich", nameEn: "United Kingdom", nameSl: "Združeno kraljestvo" },
  { name: "🇮🇪", countryCode: "ie", lat: 53.1424, lng: -7.6921, nameDe: "Irland", nameEn: "Ireland", nameSl: "Irska" },
  { name: "🇳🇱", countryCode: "nl", lat: 52.1326, lng: 5.2913, nameDe: "Niederlande", nameEn: "Netherlands", nameSl: "Nizozemska" },
  { name: "🇧🇪", countryCode: "be", lat: 50.5039, lng: 4.4699, nameDe: "Belgien", nameEn: "Belgium", nameSl: "Belgija" },
  { name: "🇸🇪", countryCode: "se", lat: 60.1282, lng: 18.6435, nameDe: "Schweden", nameEn: "Sweden", nameSl: "Švedska" },
  { name: "🇳🇴", countryCode: "no", lat: 60.4720, lng: 8.4689, nameDe: "Norwegen", nameEn: "Norway", nameSl: "Norveška" },
  { name: "🇫🇮", countryCode: "fi", lat: 61.9241, lng: 25.7482, nameDe: "Finnland", nameEn: "Finland", nameSl: "Finska" },
  { name: "🇩🇰", countryCode: "dk", lat: 56.2639, lng: 9.5018, nameDe: "Dänemark", nameEn: "Denmark", nameSl: "Danska" },
  { name: "🇵🇱", countryCode: "pl", lat: 51.9194, lng: 19.1451, nameDe: "Polen", nameEn: "Poland", nameSl: "Poljska" },
  { name: "🇨🇿", countryCode: "cz", lat: 49.8175, lng: 15.4730, nameDe: "Tschechien", nameEn: "Czechia", nameSl: "Češka" },
  { name: "🇭🇺", countryCode: "hu", lat: 47.1625, lng: 19.5033, nameDe: "Ungarn", nameEn: "Hungary", nameSl: "Madžarska" },
  { name: "🇬🇷", countryCode: "gr", lat: 39.0742, lng: 21.8243, nameDe: "Griechenland", nameEn: "Greece", nameSl: "Grčija" },
  { name: "🇹🇷", countryCode: "tr", lat: 38.9637, lng: 35.2433, nameDe: "Türkei", nameEn: "Turkey", nameSl: "Turčija" },
  { name: "🇺🇦", countryCode: "ua", lat: 48.3794, lng: 31.1656, nameDe: "Ukraine", nameEn: "Ukraine", nameSl: "Ukrajina" },
  { name: "🇷🇺", countryCode: "ru", lat: 61.5240, lng: 105.3188, nameDe: "Russland", nameEn: "Russia", nameSl: "Rusija" },
  { name: "🇸🇮", countryCode: "si", lat: 46.1512, lng: 14.9955, nameDe: "Slowenien", nameEn: "Slovenia", nameSl: "Slovenija" },
  { name: "🇭🇷", countryCode: "hr", lat: 45.1, lng: 15.2, nameDe: "Kroatien", nameEn: "Croatia", nameSl: "Hrvaška" },
  { name: "🇷🇴", countryCode: "ro", lat: 45.9432, lng: 24.9668, nameDe: "Rumänien", nameEn: "Romania", nameSl: "Romunija" },
  { name: "🇧🇬", countryCode: "bg", lat: 42.7339, lng: 25.4858, nameDe: "Bulgarien", nameEn: "Bulgaria", nameSl: "Bolgarija" },
  { name: "🇷🇸", countryCode: "rs", lat: 44.0165, lng: 21.0059, nameDe: "Serbien", nameEn: "Serbia", nameSl: "Srbija" },
  { name: "🇸🇰", countryCode: "sk", lat: 48.6690, lng: 19.6990, nameDe: "Slowakei", nameEn: "Slovakia", nameSl: "Slovaška" },
  { name: "🇱🇺", countryCode: "lu", lat: 49.8153, lng: 6.1296, nameDe: "Luxemburg", nameEn: "Luxembourg", nameSl: "Luksemburg" },
  { name: "🇮🇸", countryCode: "is", lat: 64.9631, lng: -19.0208, nameDe: "Island", nameEn: "Iceland", nameSl: "Islandija" },

  // Americas
  { name: "🇺🇸", countryCode: "us", lat: 37.0902, lng: -95.7129, nameDe: "USA", nameEn: "United States", nameSl: "ZDA" },
  { name: "🇨🇦", countryCode: "ca", lat: 56.1304, lng: -106.3468, nameDe: "Kanada", nameEn: "Canada", nameSl: "Kanada" },
  { name: "🇲🇽", countryCode: "mx", lat: 23.6345, lng: -102.5528, nameDe: "Mexiko", nameEn: "Mexico", nameSl: "Mehika" },
  { name: "🇧🇷", countryCode: "br", lat: -14.2350, lng: -51.9253, nameDe: "Brasilien", nameEn: "Brazil", nameSl: "Brazilija" },
  { name: "🇦🇷", countryCode: "ar", lat: -38.4161, lng: -63.6167, nameDe: "Argentinien", nameEn: "Argentina", nameSl: "Argentina" },
  { name: "🇨🇱", countryCode: "cl", lat: -35.6751, lng: -71.5430, nameDe: "Chile", nameEn: "Chile", nameSl: "Čile" },
  { name: "🇨🇴", countryCode: "co", lat: 4.5709, lng: -74.2973, nameDe: "Kolumbien", nameEn: "Colombia", nameSl: "Kolumbija" },
  { name: "🇵🇪", countryCode: "pe", lat: -9.1900, lng: -75.0152, nameDe: "Peru", nameEn: "Peru", nameSl: "Peru" },
  { name: "🇨🇺", countryCode: "cu", lat: 21.5218, lng: -77.7812, nameDe: "Kuba", nameEn: "Cuba", nameSl: "Kuba" },
  { name: "🇯🇲", countryCode: "jm", lat: 18.1096, lng: -77.2975, nameDe: "Jamaika", nameEn: "Jamaica", nameSl: "Jamajka" },

  // Asia
  { name: "🇯🇵", countryCode: "jp", lat: 36.2048, lng: 138.2529, nameDe: "Japan", nameEn: "Japan", nameSl: "Japonska" },
  { name: "🇨🇳", countryCode: "cn", lat: 35.8617, lng: 104.1954, nameDe: "China", nameEn: "China", nameSl: "Kitajska" },
  { name: "🇰🇷", countryCode: "kr", lat: 35.9078, lng: 127.7669, nameDe: "Südkorea", nameEn: "South Korea", nameSl: "Južna Koreja" },
  { name: "🇮🇳", countryCode: "in", lat: 20.5937, lng: 78.9629, nameDe: "Indien", nameEn: "India", nameSl: "Indija" },
  { name: "🇹🇭", countryCode: "th", lat: 15.8700, lng: 100.9925, nameDe: "Thailand", nameEn: "Thailand", nameSl: "Tajska" },
  { name: "🇻🇳", countryCode: "vn", lat: 14.0583, lng: 108.2772, nameDe: "Vietnam", nameEn: "Vietnam", nameSl: "Vietnam" },
  { name: "🇮🇩", countryCode: "id", lat: -0.7893, lng: 113.9213, nameDe: "Indonesien", nameEn: "Indonesia", nameSl: "Indonezija" },
  { name: "🇵🇭", countryCode: "ph", lat: 12.8797, lng: 121.7740, nameDe: "Philippinen", nameEn: "Philippines", nameSl: "Filipini" },
  { name: "🇲🇾", countryCode: "my", lat: 4.2105, lng: 101.9758, nameDe: "Malaysia", nameEn: "Malaysia", nameSl: "Malezija" },
  { name: "🇸🇬", countryCode: "sg", lat: 1.3521, lng: 103.8198, nameDe: "Singapur", nameEn: "Singapore", nameSl: "Singapur" },
  { name: "🇵🇰", countryCode: "pk", lat: 30.3753, lng: 69.3451, nameDe: "Pakistan", nameEn: "Pakistan", nameSl: "Pakistan" },
  { name: "🇧🇩", countryCode: "bd", lat: 23.685, lng: 90.3563, nameDe: "Bangladesch", nameEn: "Bangladesh", nameSl: "Bangladeš" },
  { name: "🇳🇵", countryCode: "np", lat: 28.3949, lng: 84.124, nameDe: "Nepal", nameEn: "Nepal", nameSl: "Nepal" },
  { name: "🇸🇦", countryCode: "sa", lat: 23.8859, lng: 45.0792, nameDe: "Saudi-Arabien", nameEn: "Saudi Arabia", nameSl: "Saudova Arabija" },
  { name: "🇦🇪", countryCode: "ae", lat: 23.4241, lng: 53.8478, nameDe: "VAE", nameEn: "UAE", nameSl: "ZAE" },
  { name: "🇮🇱", countryCode: "il", lat: 31.0461, lng: 34.8516, nameDe: "Israel", nameEn: "Israel", nameSl: "Izrael" },
  { name: "🇮🇷", countryCode: "ir", lat: 32.4279, lng: 53.688, nameDe: "Iran", nameEn: "Iran", nameSl: "Iran" },

  // Africa
  { name: "🇿🇦", countryCode: "za", lat: -30.5595, lng: 22.9375, nameDe: "Südafrika", nameEn: "South Africa", nameSl: "Južna Afrika" },
  { name: "🇪🇬", countryCode: "eg", lat: 26.8206, lng: 30.8025, nameDe: "Ägypten", nameEn: "Egypt", nameSl: "Egipt" },
  { name: "🇳🇬", countryCode: "ng", lat: 9.082, lng: 8.6753, nameDe: "Nigeria", nameEn: "Nigeria", nameSl: "Nigerija" },
  { name: "🇰🇪", countryCode: "ke", lat: -0.0236, lng: 37.9062, nameDe: "Kenia", nameEn: "Kenya", nameSl: "Kenija" },
  { name: "🇲🇦", countryCode: "ma", lat: 31.7917, lng: -7.0926, nameDe: "Marokko", nameEn: "Morocco", nameSl: "Maroko" },
  { name: "🇪🇹", countryCode: "et", lat: 9.145, lng: 40.4897, nameDe: "Äthiopien", nameEn: "Ethiopia", nameSl: "Etiopija" },
  { name: "🇹🇿", countryCode: "tz", lat: -6.369, lng: 34.8888, nameDe: "Tansania", nameEn: "Tanzania", nameSl: "Tanzanija" },
  { name: "🇬🇭", countryCode: "gh", lat: 7.9465, lng: -1.0232, nameDe: "Ghana", nameEn: "Ghana", nameSl: "Gana" },

  // Oceania
  { name: "🇦🇺", countryCode: "au", lat: -25.2744, lng: 133.7751, nameDe: "Australien", nameEn: "Australia", nameSl: "Avstralija" },
  { name: "🇳🇿", countryCode: "nz", lat: -40.9006, lng: 174.886, nameDe: "Neuseeland", nameEn: "New Zealand", nameSl: "Nova Zelandija" },
];

// Interesting/funny place names with their country codes
const PLACE_NAME_QUESTIONS = [
  // Funny place names
  { name: "Fucking", countryCode: "at", lat: 48.0673, lng: 12.8633, additionalInfo: JSON.stringify({ funFact: "Renamed to Fugging in 2021", type: "village" }), nameDe: "Fucking, Österreich", nameEn: "Fucking, Austria", nameSl: "Fucking, Avstrija" },
  { name: "Wank", countryCode: "de", lat: 47.4722, lng: 11.2589, additionalInfo: JSON.stringify({ funFact: "A mountain near Garmisch", type: "mountain" }), nameDe: "Wank, Deutschland", nameEn: "Wank, Germany", nameSl: "Wank, Nemčija" },
  { name: "Hell", countryCode: "no", lat: 63.4453, lng: 10.9060, additionalInfo: JSON.stringify({ funFact: "Known for freezing in winter", type: "village" }), nameDe: "Hell, Norwegen", nameEn: "Hell, Norway", nameSl: "Hell, Norveška" },
  { name: "Batman", countryCode: "tr", lat: 37.8833, lng: 41.1333, additionalInfo: JSON.stringify({ funFact: "A city and province", type: "city" }), nameDe: "Batman, Türkei", nameEn: "Batman, Turkey", nameSl: "Batman, Turčija" },
  { name: "Poo", countryCode: "es", lat: 43.4519, lng: -4.8392, additionalInfo: JSON.stringify({ funFact: "A village in Asturias", type: "village" }), nameDe: "Poo, Spanien", nameEn: "Poo, Spain", nameSl: "Poo, Španija" },
  { name: "Boring", countryCode: "us", lat: 45.4318, lng: -122.3743, additionalInfo: JSON.stringify({ funFact: "Sister city of Dull, Scotland", type: "town" }), nameDe: "Boring, USA", nameEn: "Boring, USA", nameSl: "Boring, ZDA" },
  { name: "Dull", countryCode: "gb", lat: 56.5150, lng: -4.0178, additionalInfo: JSON.stringify({ funFact: "Sister city of Boring, Oregon", type: "village" }), nameDe: "Dull, Schottland", nameEn: "Dull, Scotland", nameSl: "Dull, Škotska" },
  { name: "Llanfairpwllgwyngyll", countryCode: "gb", lat: 53.2214, lng: -4.2017, additionalInfo: JSON.stringify({ funFact: "Longest place name in Europe", type: "village" }), nameDe: "Llanfairpwllgwyngyll, Wales", nameEn: "Llanfairpwllgwyngyll, Wales", nameSl: "Llanfairpwllgwyngyll, Wales" },
  { name: "Anus", countryCode: "fr", lat: 47.5833, lng: 3.8167, additionalInfo: JSON.stringify({ funFact: "A commune in Burgundy", type: "village" }), nameDe: "Anus, Frankreich", nameEn: "Anus, France", nameSl: "Anus, Francija" },
  { name: "Condom", countryCode: "fr", lat: 43.9597, lng: 0.3733, additionalInfo: JSON.stringify({ funFact: "Town famous for Armagnac brandy", type: "town" }), nameDe: "Condom, Frankreich", nameEn: "Condom, France", nameSl: "Condom, Francija" },
  { name: "Middelfart", countryCode: "dk", lat: 55.5061, lng: 9.7289, additionalInfo: JSON.stringify({ funFact: "Means 'middle crossing'", type: "city" }), nameDe: "Middelfart, Dänemark", nameEn: "Middelfart, Denmark", nameSl: "Middelfart, Danska" },
  { name: "Wankie", countryCode: "zw", lat: -18.3667, lng: 25.85, additionalInfo: JSON.stringify({ funFact: "Now called Hwange", type: "town" }), nameDe: "Wankie, Simbabwe", nameEn: "Wankie, Zimbabwe", nameSl: "Wankie, Zimbabve" },
  { name: "Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu", countryCode: "nz", lat: -40.3479, lng: 176.5467, additionalInfo: JSON.stringify({ funFact: "Longest place name in the world", type: "hill" }), nameDe: "Taumatawhakatangi..., Neuseeland", nameEn: "Taumatawhakatangi..., New Zealand", nameSl: "Taumatawhakatangi..., Nova Zelandija" },
  { name: "Disappointment Island", countryCode: "nz", lat: -50.6, lng: 165.9833, additionalInfo: JSON.stringify({ funFact: "Named for poor seal hunting", type: "island" }), nameDe: "Disappointment Island, Neuseeland", nameEn: "Disappointment Island, New Zealand", nameSl: "Disappointment Island, Nova Zelandija" },
  { name: "Why", countryCode: "us", lat: 32.2682, lng: -112.7378, additionalInfo: JSON.stringify({ funFact: "Y-shaped intersection of highways", type: "town" }), nameDe: "Why, USA", nameEn: "Why, USA", nameSl: "Why, ZDA" },
  { name: "Nothing", countryCode: "us", lat: 34.4737, lng: -113.0267, additionalInfo: JSON.stringify({ funFact: "Ghost town in Arizona", type: "ghost town" }), nameDe: "Nothing, USA", nameEn: "Nothing, USA", nameSl: "Nothing, ZDA" },
  { name: "Egg", countryCode: "at", lat: 47.4331, lng: 9.8964, additionalInfo: JSON.stringify({ funFact: "Village in Vorarlberg", type: "village" }), nameDe: "Egg, Österreich", nameEn: "Egg, Austria", nameSl: "Egg, Avstrija" },
  { name: "Beer", countryCode: "gb", lat: 50.6986, lng: -3.0892, additionalInfo: JSON.stringify({ funFact: "Coastal village in Devon", type: "village" }), nameDe: "Beer, England", nameEn: "Beer, England", nameSl: "Beer, Anglija" },
  { name: "Sexmoan", countryCode: "ph", lat: 14.9225, lng: 120.6167, additionalInfo: JSON.stringify({ funFact: "Now called Sasmuan", type: "municipality" }), nameDe: "Sexmoan, Philippinen", nameEn: "Sexmoan, Philippines", nameSl: "Sexmoan, Filipini" },
  { name: "Penistone", countryCode: "gb", lat: 53.5256, lng: -1.6306, additionalInfo: JSON.stringify({ funFact: "Market town in South Yorkshire", type: "town" }), nameDe: "Penistone, England", nameEn: "Penistone, England", nameSl: "Penistone, Anglija" },
  { name: "Bitche", countryCode: "fr", lat: 49.0500, lng: 7.4333, additionalInfo: JSON.stringify({ funFact: "Town near German border", type: "town" }), nameDe: "Bitche, Frankreich", nameEn: "Bitche, France", nameSl: "Bitche, Francija" },
  { name: "Intercourse", countryCode: "us", lat: 40.0376, lng: -76.1044, additionalInfo: JSON.stringify({ funFact: "Amish community in Pennsylvania", type: "village" }), nameDe: "Intercourse, USA", nameEn: "Intercourse, USA", nameSl: "Intercourse, ZDA" },
  { name: "French Lick", countryCode: "us", lat: 38.5492, lng: -86.6197, additionalInfo: JSON.stringify({ funFact: "Larry Bird's hometown", type: "town" }), nameDe: "French Lick, USA", nameEn: "French Lick, USA", nameSl: "French Lick, ZDA" },
  { name: "Santa Claus", countryCode: "us", lat: 38.1200, lng: -86.9142, additionalInfo: JSON.stringify({ funFact: "Town in Indiana", type: "town" }), nameDe: "Santa Claus, USA", nameEn: "Santa Claus, USA", nameSl: "Santa Claus, ZDA" },
  { name: "No Name", countryCode: "us", lat: 39.5650, lng: -107.2919, additionalInfo: JSON.stringify({ funFact: "Unincorporated community in Colorado", type: "community" }), nameDe: "No Name, USA", nameEn: "No Name, USA", nameSl: "No Name, ZDA" },
];

async function main() {
  console.log("🌍 Seeding country quiz questions...\n");

  let flagsCreated = 0;
  let flagsSkipped = 0;
  let placesCreated = 0;
  let placesSkipped = 0;

  // Seed flag questions
  console.log("🏴 Seeding flag questions...");
  for (const flag of FLAG_QUESTIONS) {
    // Check if already exists
    const existing = await db
      .select()
      .from(worldLocations)
      .where(
        and(
          eq(worldLocations.category, "country-flags"),
          eq(worldLocations.name, flag.name)
        )
      );

    if (existing.length > 0) {
      flagsSkipped++;
      continue;
    }

    await db.insert(worldLocations).values({
      category: "country-flags",
      name: flag.name,
      nameDe: flag.nameDe,
      nameEn: flag.nameEn,
      nameSl: flag.nameSl,
      latitude: flag.lat,
      longitude: flag.lng,
      countryCode: flag.countryCode,
      difficulty: "medium",
      createdAt: new Date(),
    });
    flagsCreated++;
  }

  console.log(`   ✅ Created: ${flagsCreated}, ⏭️ Skipped: ${flagsSkipped}`);

  // Seed place name questions
  console.log("\n📍 Seeding place name questions...");
  for (const place of PLACE_NAME_QUESTIONS) {
    // Check if already exists
    const existing = await db
      .select()
      .from(worldLocations)
      .where(
        and(
          eq(worldLocations.category, "place-names"),
          eq(worldLocations.name, place.name)
        )
      );

    if (existing.length > 0) {
      placesSkipped++;
      continue;
    }

    await db.insert(worldLocations).values({
      category: "place-names",
      name: place.name,
      nameDe: place.nameDe,
      nameEn: place.nameEn,
      nameSl: place.nameSl,
      latitude: place.lat,
      longitude: place.lng,
      countryCode: place.countryCode,
      additionalInfo: place.additionalInfo,
      difficulty: "medium",
      createdAt: new Date(),
    });
    placesCreated++;
  }

  console.log(`   ✅ Created: ${placesCreated}, ⏭️ Skipped: ${placesSkipped}`);

  console.log("\n📈 Summary:");
  console.log(`   Flags: ${flagsCreated} created, ${flagsSkipped} skipped`);
  console.log(`   Places: ${placesCreated} created, ${placesSkipped} skipped`);
  console.log(`   Total new questions: ${flagsCreated + placesCreated}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
