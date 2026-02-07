// ─── Category display names ─────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  cities_population: { de: "Städte (Einwohner)", en: "Cities (Population)" },
  landmarks_height: { de: "Wahrzeichen (Höhe)", en: "Landmarks (Height)" },
  landmarks_length: { de: "Wahrzeichen (Länge)", en: "Landmarks (Length)" },
  nature_elevation: { de: "Natur (Höhe)", en: "Nature (Elevation)" },
  nature_rivers: { de: "Natur (Flüsse)", en: "Nature (Rivers)" },
  extremes_temperature: {
    de: "Extreme (Temperatur)",
    en: "Extremes (Temperature)",
  },
  extremes_rainfall: {
    de: "Extreme (Niederschlag)",
    en: "Extremes (Rainfall)",
  },
  lakes_area: { de: "Seen (Fläche)", en: "Lakes (Area)" },
  lakes_depth: { de: "Seen (Tiefe)", en: "Lakes (Depth)" },
  space_distance: { de: "Weltraum (Entfernung)", en: "Space (Distance)" },
  space_time: { de: "Weltraum (Zeit)", en: "Space (Time)" },
  islands: { de: "Inseln", en: "Islands" },
  distances: { de: "Distanzen", en: "Distances" },
  countries_population: {
    de: "Länder (Einwohner)",
    en: "Countries (Population)",
  },
  countries_area: { de: "Länder (Fläche)", en: "Countries (Area)" },
  countries_elevation: {
    de: "Länder (Höchster Punkt)",
    en: "Countries (Elevation)",
  },
};

export function getCategoryLabel(category: string, locale: string): string {
  return CATEGORY_LABELS[category]?.[locale] ?? CATEGORY_LABELS[category]?.en ?? category;
}

// ─── Category gradients ─────────────────────────────────────────────────────

const CATEGORY_GRADIENTS: Record<
  string,
  { from: string; to: string; glow: string }
> = {
  cities_population: {
    from: "#1a0a2e",
    to: "#16213e",
    glow: "rgba(106, 90, 205, 0.15)",
  },
  landmarks_height: {
    from: "#1a1a2e",
    to: "#0f3460",
    glow: "rgba(15, 52, 96, 0.2)",
  },
  landmarks_length: {
    from: "#1a1a2e",
    to: "#0f3460",
    glow: "rgba(15, 52, 96, 0.2)",
  },
  nature_elevation: {
    from: "#0a1f0a",
    to: "#1a3a2a",
    glow: "rgba(0, 255, 136, 0.1)",
  },
  nature_rivers: {
    from: "#0a1a2e",
    to: "#0d2847",
    glow: "rgba(0, 150, 255, 0.12)",
  },
  extremes_temperature: {
    from: "#2e0a0a",
    to: "#3e1616",
    glow: "rgba(255, 80, 50, 0.15)",
  },
  extremes_rainfall: {
    from: "#0a1a2e",
    to: "#1a2e4e",
    glow: "rgba(70, 130, 230, 0.12)",
  },
  lakes_area: {
    from: "#0a1a3e",
    to: "#0d2b5e",
    glow: "rgba(0, 120, 255, 0.15)",
  },
  lakes_depth: {
    from: "#0a0f2e",
    to: "#0a1a4e",
    glow: "rgba(30, 60, 200, 0.15)",
  },
  space_distance: {
    from: "#1a0a3e",
    to: "#2e0a4e",
    glow: "rgba(140, 50, 255, 0.15)",
  },
  space_time: {
    from: "#1a0a3e",
    to: "#2e0a4e",
    glow: "rgba(140, 50, 255, 0.15)",
  },
  islands: {
    from: "#0a2e1a",
    to: "#0a3e2e",
    glow: "rgba(0, 200, 150, 0.12)",
  },
  distances: {
    from: "#1a1a0a",
    to: "#2e2e0a",
    glow: "rgba(200, 200, 50, 0.1)",
  },
  countries_population: {
    from: "#1a0a2e",
    to: "#2e1a3e",
    glow: "rgba(150, 50, 200, 0.12)",
  },
  countries_area: {
    from: "#0a2e1a",
    to: "#1a3e2a",
    glow: "rgba(50, 200, 100, 0.12)",
  },
  countries_elevation: {
    from: "#1a1a0a",
    to: "#2e2e1a",
    glow: "rgba(180, 160, 50, 0.1)",
  },
};

const FALLBACK_GRADIENT = {
  from: "#0f1419",
  to: "#1a1f26",
  glow: "rgba(0, 217, 255, 0.1)",
};

export function getCategoryGradient(category: string) {
  return CATEGORY_GRADIENTS[category] ?? FALLBACK_GRADIENT;
}

// ─── Image slug helper ───────────────────────────────────────────────────────

export function getImageSlug(id: string): string {
  // Country items: "de_pop" / "de_area" / "de_peak" → "de"
  if (id.endsWith("_pop") || id.endsWith("_area") || id.endsWith("_peak")) {
    return id.replace(/_(pop|area|peak)$/, "");
  }
  // Non-country items: id matches filename directly (e.g. "c_tokyo", "i_greenland", "sp_moon")
  return id;
}
