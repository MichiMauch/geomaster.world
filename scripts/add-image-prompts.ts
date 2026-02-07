/**
 * Adds Midjourney "Blue Hour" image prompts to horizon items CSV.
 *
 * Reads:  ~/Downloads/horizon-items.csv
 * Writes: ~/Downloads/horizon-items-with-prompts.csv
 *
 * Usage: npx tsx scripts/add-image-prompts.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// ── Name translations (German → English) ────────────────────────────────────

const NAME_TRANSLATIONS: Record<string, string> = {
  // Islands
  Grönland: "Greenland",
  Neuguinea: "New Guinea",
  Madagaskar: "Madagascar",
  Baffininsel: "Baffin Island",
  Großbritannien: "Great Britain",
  Honshū: "Honshu",
  Hokkaidō: "Hokkaido",
  Kuba: "Cuba",
  Island: "Iceland",
  Irland: "Ireland",
  Tasmanien: "Tasmania",
  Sizilien: "Sicily",
  Sardinien: "Sardinia",

  // Distances
  "London ↔ New York": "London ↔ New York",
  "Berlin ↔ Peking": "Berlin ↔ Beijing",
  "Los Angeles ↔ Tokio": "Los Angeles ↔ Tokyo",
  "Länge Afrika": "Length of Africa",
  "Breite Russland": "Width of Russia",
  "Länge Chile": "Length of Chile",
  Erdumfang: "Earth's Circumference",
  "Strecke der ISS": "ISS Daily Orbit Distance",

  // Temperatures
  Antarktis: "Antarctica",
  Oimjakon: "Oymyakon",

  // Lakes
  "Kaspisches Meer": "Caspian Sea",
  "Oberer See": "Lake Superior",
  Victoriasee: "Lake Victoria",
  Baikalsee: "Lake Baikal",
  Bodensee: "Lake Constance",
  Titicacasee: "Lake Titicaca",

  // Rainfall
  // Mawsynram stays as is
  // London stays as is

  // Space
  "Entfernung zum Mond": "Distance to the Moon",
  "ISS Flughöhe": "ISS Orbital Altitude",
  "Licht zur Erde": "Sunlight to Earth",
  "Tag auf der Venus": "A Day on Venus",

  // Rivers
  Nil: "Nile",
  Amazonas: "Amazon",
  Jangtsekiang: "Yangtze",
  Rhein: "Rhine",
  Donau: "Danube",

  // Oceans
  "Pazifischer Ozean": "Pacific Ocean",
  Atlantik: "Atlantic Ocean",
  Mittelmeer: "Mediterranean Sea",

  // Mountains
  Kilimandscharo: "Kilimanjaro",

  // Landmarks
  Eiffelturm: "Eiffel Tower",
  "Cheops-Pyramide": "Great Pyramid of Giza",
  "Kölner Dom": "Cologne Cathedral",
  Freiheitsstatue: "Statue of Liberty",
  "Ulmer Münster": "Ulm Minster",
  "Brandenburger Tor": "Brandenburg Gate",
  "Chinesische Mauer": "Great Wall of China",
  "Gotthard-Basistunnel": "Gotthard Base Tunnel",

  // Countries
  Russland: "Russia",
  Bangladesch: "Bangladesh",
  Algerien: "Algeria",
  Kanada: "Canada",
  Spanien: "Spain",
  Kasachstan: "Kazakhstan",
  Indonesien: "Indonesia",
  Australien: "Australia",
  Malediven: "Maldives",
  Niederlande: "Netherlands",
  Vatikanstadt: "Vatican City",
  Mongolei: "Mongolia",
  Ägypten: "Egypt",
  Türkei: "Turkey",
  Deutschland: "Germany",
  Indien: "India",
  Brasilien: "Brazil",
  Dänemark: "Denmark",
  Schweiz: "Switzerland",
  Äthiopien: "Ethiopia",
  Südkorea: "South Korea",
  Kolumbien: "Colombia",
  Argentinien: "Argentina",
  Südafrika: "South Africa",
  Tansania: "Tanzania",
  Schweden: "Sweden",
  Norwegen: "Norway",
  Finnland: "Finland",
  Neuseeland: "New Zealand",
  "Papua-Neuguinea": "Papua New Guinea",
  Venezuela: "Venezuela",
  Nordkorea: "North Korea",
  "Ver. Arab. Emirate": "United Arab Emirates",
  Namibia: "Namibia",
  "Vereinigtes Königreich": "United Kingdom",
  Frankreich: "France",
  Italien: "Italy",
  Griechenland: "Greece",
  Singapur: "Singapore",
  Österreich: "Austria",
  Belgien: "Belgium",
  Bolivien: "Bolivia",
  Philippinen: "Philippines",
  "Mexiko-Stadt": "Mexico City",
  Mexiko: "Mexico",
  "DR Kongo": "DR Congo",
  "Saudi-Arabien": "Saudi Arabia",
  "Sri Lanka": "Sri Lanka",
  "Puerto Rico": "Puerto Rico",
  Libyen: "Libya",
  Katar: "Qatar",
  Hongkong: "Hong Kong",
  Ukraine: "Ukraine",
  Polen: "Poland",
  Usbekistan: "Uzbekistan",
  Tokio: "Tokyo",
  Peking: "Beijing",
};

// ── Blue Hour suffix ─────────────────────────────────────────────────────────

const BLUE_HOUR_SUFFIX =
  "during blue hour twilight. Deep indigo and violet tones, cold atmosphere. Stark contrast, highly detailed, shot on 35mm, wide angle view, masterpiece --ar 16:9 --v 6.0";

// ── Helper: clean name and translate ─────────────────────────────────────────

function cleanAndTranslate(rawName: string): string {
  // Remove parenthetical suffixes like "(Fläche)", "(Bevölkerung)", etc.
  const cleaned = rawName.replace(/\s*\(.*?\)\s*$/, "").trim();
  return NAME_TRANSLATIONS[cleaned] ?? cleaned;
}

// ── Prompt generation by category ────────────────────────────────────────────

function generatePrompt(
  name: string,
  category: string,
  id: string
): string {
  const englishName = cleanAndTranslate(name);

  // ── Space items ──────────────────────────────────────────────────────────
  if (category.startsWith("space_")) {
    const subjectMap: Record<string, string> = {
      sp_moon:
        "sweeping cinematic view of the Moon from space, cosmic atmosphere with stars and deep blue void",
      sp_iss:
        "sweeping cinematic view of the International Space Station orbiting Earth, cosmic atmosphere with stars and deep blue void",
      sp_sun_light:
        "sweeping cinematic view of sunlight traveling through the solar system towards Earth, cosmic atmosphere with stars and deep blue void",
      sp_day_venus:
        "sweeping cinematic view of Venus rotating slowly in space, cosmic atmosphere with stars and deep blue void",
    };
    const subject =
      subjectMap[id] ??
      `sweeping cinematic view of ${englishName} from space, cosmic atmosphere with stars and deep blue void`;
    return `${subject}, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Distances ────────────────────────────────────────────────────────────
  if (category === "distances") {
    const distanceMap: Record<string, string> = {
      d_london_ny:
        "sweeping cinematic aerial view, the vast expanse of the Atlantic Ocean between London and New York, ships below and horizon glowing",
      d_berlin_beijing:
        "sweeping cinematic aerial view, the vast Eurasian continent stretching between Berlin and Beijing, steppes and mountain ranges below",
      d_la_tokyo:
        "sweeping cinematic aerial view, the vast expanse of the Pacific Ocean between Los Angeles and Tokyo, endless water and horizon",
      d_africa_length:
        "sweeping cinematic aerial view, the full length of Africa from Cairo to Cape Town, desert sands transforming into savannas and lush forests",
      d_russia_width:
        "sweeping cinematic aerial view, the vast width of Russia from Moscow to Vladivostok, endless taiga and frozen tundra",
      d_chile_length:
        "sweeping cinematic aerial view, the full length of Chile from the Atacama desert to Patagonian glaciers, Andes mountains along the coast",
      d_earth_circum:
        "sweeping cinematic view of planet Earth from low orbit, the curved horizon revealing the full circumference of the globe",
      d_iss_orbit:
        "sweeping cinematic view of the ISS orbiting Earth at high speed, streaks of city lights below on the dark surface",
    };
    const subject =
      distanceMap[id] ??
      `sweeping cinematic aerial view, the vast expanse between distant places on Earth`;
    return `${subject}, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Islands ──────────────────────────────────────────────────────────────
  if (category === "islands") {
    return `sweeping cinematic landscape of ${englishName}, a vast remote island with rugged coastlines and dramatic terrain, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Cities ───────────────────────────────────────────────────────────────
  if (category === "cities_population") {
    return `sweeping cinematic cityscape of ${englishName}, futuristic skyline with glowing city lights amidst the dark blue twilight, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Lakes ────────────────────────────────────────────────────────────────
  if (category === "lakes_area" || category === "lakes_depth") {
    return `sweeping cinematic landscape of ${englishName}, a vast serene lake reflecting the twilight sky, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Rivers ───────────────────────────────────────────────────────────────
  if (category === "nature_rivers") {
    return `sweeping cinematic landscape of the ${englishName}, a mighty river winding through dramatic terrain, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Landmarks ────────────────────────────────────────────────────────────
  if (
    category === "landmarks_height" ||
    category === "landmarks_length"
  ) {
    // Titanic is a special case
    if (id === "l_titanic") {
      return `sweeping cinematic view of the RMS Titanic sailing on a calm ocean, iconic ship glowing against the dark horizon, ${BLUE_HOUR_SUFFIX}`;
    }
    return `sweeping cinematic view of ${englishName}, iconic architectural landmark towering against the skyline, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Extremes: Temperature ────────────────────────────────────────────────
  if (category === "extremes_temperature") {
    const tempMap: Record<string, string> = {
      t_hot_deathvalley:
        "sweeping cinematic landscape of Death Valley, extreme climate with scorching heat haze rising from cracked desert floor",
      t_cold_antarctica:
        "sweeping cinematic landscape of Antarctica, extreme climate with frozen ice sheets and piercing cold atmosphere under polar skies",
      t_cold_oymyakon:
        "sweeping cinematic landscape of Oymyakon, Siberia, extreme climate with frozen tundra and ice-covered village in brutal cold",
    };
    const subject =
      tempMap[id] ??
      `sweeping cinematic landscape of ${englishName}, extreme climate with dramatic atmosphere`;
    return `${subject}, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Extremes: Rainfall ───────────────────────────────────────────────────
  if (category === "extremes_rainfall") {
    const rainMap: Record<string, string> = {
      misc_rain_mawsynram:
        "sweeping cinematic landscape of Mawsynram, India, lush tropical monsoon atmosphere with torrential rain cascading over emerald hills",
      misc_rain_london:
        "sweeping cinematic cityscape of London, moody overcast atmosphere with gentle rain over the Thames and iconic skyline",
    };
    const subject =
      rainMap[id] ??
      `sweeping cinematic landscape of ${englishName}, dramatic weather atmosphere`;
    return `${subject}, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Ocean depths (nature_elevation with ocean IDs) ───────────────────────
  if (
    category === "nature_elevation" &&
    (id === "o_pacific" || id === "o_atlantic" || id === "o_mediterranean")
  ) {
    const oceanMap: Record<string, string> = {
      o_pacific:
        "sweeping cinematic underwater view of the Pacific Ocean's Mariana Trench, abyssal depths with bioluminescent creatures in the deep blue void",
      o_atlantic:
        "sweeping cinematic underwater view of the Atlantic Ocean's Puerto Rico Trench, dark abyssal waters with faint light filtering from above",
      o_mediterranean:
        "sweeping cinematic underwater view of the Mediterranean Sea's Calypso Deep, ancient deep waters with rocky formations in the twilight zone",
    };
    return `${oceanMap[id]}, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Lake Titicaca (nature_elevation) ─────────────────────────────────────
  if (category === "nature_elevation" && id === "n_titicaca") {
    return `sweeping cinematic landscape of Lake Titicaca, a vast serene high-altitude lake reflecting the twilight sky amid the Andes mountains, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Mountains / Nature elevation ─────────────────────────────────────────
  if (category === "nature_elevation") {
    return `sweeping cinematic landscape of ${englishName}, majestic snow-capped peak piercing the starry sky, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Countries: elevation (mountain peaks) ────────────────────────────────
  if (category === "countries_elevation") {
    return `sweeping cinematic landscape of ${englishName}, vast terrain with dramatic natural features, rolling hills and open skies, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Countries: population & area ─────────────────────────────────────────
  if (
    category === "countries_population" ||
    category === "countries_area"
  ) {
    return `sweeping cinematic landscape of ${englishName}, vast terrain with dramatic natural features, rolling hills and open skies, ${BLUE_HOUR_SUFFIX}`;
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  return `sweeping cinematic landscape of ${englishName}, ${BLUE_HOUR_SUFFIX}`;
}

// ── CSV parsing (handles quoted fields with commas) ──────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const inputPath = join(homedir(), "Downloads", "horizon-items.csv");
  const outputPath = join(
    homedir(),
    "Downloads",
    "horizon-items-with-prompts.csv"
  );

  const raw = readFileSync(inputPath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    console.error("CSV is empty!");
    process.exit(1);
  }

  // Header
  const headerFields = parseCSVLine(lines[0]);
  const idIdx = headerFields.indexOf("id");
  const nameIdx = headerFields.indexOf("name");
  const categoryIdx = headerFields.indexOf("category");

  if (idIdx === -1 || nameIdx === -1 || categoryIdx === -1) {
    console.error("Missing required columns (id, name, category)");
    process.exit(1);
  }

  const outputLines: string[] = [];

  // Add header with new column
  outputLines.push(
    headerFields.map(escapeCSVField).join(",") + ",image_prompt"
  );

  let count = 0;
  let missingPrompts = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const id = fields[idIdx];
    const name = fields[nameIdx];
    const category = fields[categoryIdx];

    const prompt = generatePrompt(name, category, id);

    if (!prompt) {
      missingPrompts++;
      console.warn(`⚠ No prompt for: ${id} (${name}) [${category}]`);
    }

    outputLines.push(
      fields.map(escapeCSVField).join(",") + "," + escapeCSVField(prompt)
    );
    count++;
  }

  writeFileSync(outputPath, outputLines.join("\n") + "\n", "utf-8");

  console.log(`✅ Done! ${count} items processed.`);
  if (missingPrompts > 0) {
    console.warn(`⚠ ${missingPrompts} items have empty prompts.`);
  }
  console.log(`📄 Output: ${outputPath}`);

  // Verification: check a few samples
  console.log("\n── Sample prompts ──");
  const samples = [1, 22, 40, 44, 53, 62, 67, 72, 82];
  for (const idx of samples) {
    if (idx < lines.length) {
      const fields = parseCSVLine(lines[idx]);
      const prompt = generatePrompt(
        fields[nameIdx],
        fields[categoryIdx],
        fields[idIdx]
      );
      console.log(
        `  ${fields[idIdx]} (${fields[categoryIdx]}): ${prompt.substring(0, 100)}...`
      );
    }
  }
}

main();
