import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Category mapping (same as seed script)
const CATEGORY_MAP: Record<string, string> = {
  "extremes|°C": "extremes_temperature",
  "extremes|mm": "extremes_rainfall",
  "lakes|km²": "lakes_area",
  "lakes|Meter": "lakes_depth",
  "landmark|Meter": "landmarks_height",
  "landmark|Kilometer": "landmarks_length",
  "nature|Meter": "nature_elevation",
  "nature|Kilometer": "nature_rivers",
  "space|km": "space_distance",
  "space|Kilometer": "space_distance",
  "space|Sekunden": "space_time",
  "space|Stunden": "space_time",
  "islands|km²": "islands",
  "distance|km": "distances",
  "city|Einwohner": "cities_population",
};

interface RawItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  difficulty: number;
  trap_note: string;
}

interface CountryItem {
  id: string;
  name: string;
  population: number;
  area_km2: number;
  highest_point: number;
  difficulty: number;
  trap_note: string;
}

function resolveCategory(originalCategory: string, unit: string): string {
  const key = `${originalCategory}|${unit}`;
  return CATEGORY_MAP[key] || originalCategory;
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function main() {
  const dataDir = path.join(process.cwd(), "scripts", "data", "horizon");

  // 1. Read flat JSON files
  const flatFiles = ["cold.json", "pop.json", "highlowdiff.json"];
  const allRows: string[][] = [];

  for (const file of flatFiles) {
    const filePath = path.join(dataDir, file);
    const data: RawItem[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log(`  ${file}: ${data.length} items`);

    for (const item of data) {
      allRows.push([
        item.id,
        item.name,
        String(item.value),
        item.unit,
        resolveCategory(item.category, item.unit),
        String(item.difficulty),
        item.trap_note || "",
      ]);
    }
  }

  // 2. Read countryhighlow.json → 3 items per country
  const countryPath = path.join(dataDir, "countryhighlow.json");
  const countryData: CountryItem[] = JSON.parse(
    fs.readFileSync(countryPath, "utf-8")
  );
  console.log(
    `  countryhighlow.json: ${countryData.length} countries -> ${countryData.length * 3} items`
  );

  for (const country of countryData) {
    const trapNote = country.trap_note || "";

    allRows.push([
      `${country.id}_pop`,
      `${country.name} (Bevölkerung)`,
      String(country.population),
      "Einwohner",
      "countries_population",
      String(country.difficulty),
      trapNote,
    ]);

    allRows.push([
      `${country.id}_area`,
      `${country.name} (Fläche)`,
      String(country.area_km2),
      "km²",
      "countries_area",
      String(country.difficulty),
      trapNote,
    ]);

    allRows.push([
      `${country.id}_peak`,
      `${country.name} (Höchster Punkt)`,
      String(country.highest_point),
      "Meter",
      "countries_elevation",
      String(country.difficulty),
      trapNote,
    ]);
  }

  // 3. Build CSV
  const header = "id,name,value,unit,category,difficulty,trap_note";
  const csvLines = [header];

  for (const row of allRows) {
    csvLines.push(row.map(escapeCsv).join(","));
  }

  const csvContent = csvLines.join("\n") + "\n";

  // 4. Write to ~/Downloads
  const outputPath = path.join(os.homedir(), "Downloads", "horizon-items.csv");
  fs.writeFileSync(outputPath, csvContent, "utf-8");

  console.log(`\n${allRows.length} items exported to ${outputPath}`);
}

main();
