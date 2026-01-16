/**
 * Level System for GeoMaster World
 * Based on total points from Ranked Games
 */

export interface Level {
  level: number;
  minPoints: number;
  name: { de: string; en: string; sl: string };
}

export const LEVELS: Level[] = [
  { level: 1, minPoints: 0, name: { de: "Anfänger", en: "Newcomer", sl: "Začetnik" } },
  { level: 2, minPoints: 1000, name: { de: "Entdecker", en: "Explorer", sl: "Raziskovalec" } },
  { level: 3, minPoints: 3000, name: { de: "Wanderer", en: "Wanderer", sl: "Popotnik" } },
  { level: 4, minPoints: 6000, name: { de: "Pfadfinder", en: "Pathfinder", sl: "Izsledovalec" } },
  { level: 5, minPoints: 10000, name: { de: "Abenteurer", en: "Adventurer", sl: "Pustolovec" } },
  { level: 6, minPoints: 16000, name: { de: "Kartograph", en: "Cartographer", sl: "Kartograf" } },
  { level: 7, minPoints: 24000, name: { de: "Navigator", en: "Navigator", sl: "Navigator" } },
  { level: 8, minPoints: 36000, name: { de: "Globetrotter", en: "Globetrotter", sl: "Globetrotter" } },
  { level: 9, minPoints: 50000, name: { de: "Weltenbummler", en: "World Traveler", sl: "Svetovni popotnik" } },
  { level: 10, minPoints: 70000, name: { de: "Geograph", en: "Geographer", sl: "Geograf" } },
  { level: 11, minPoints: 100000, name: { de: "Expeditionsleiter", en: "Expedition Leader", sl: "Vodja ekspedicije" } },
  { level: 12, minPoints: 140000, name: { de: "Polarforscher", en: "Polar Explorer", sl: "Polarni raziskovalec" } },
  { level: 13, minPoints: 200000, name: { de: "Kosmopolit", en: "Cosmopolitan", sl: "Kozmopolit" } },
  { level: 14, minPoints: 300000, name: { de: "Weltenkenner", en: "World Expert", sl: "Svetovni strokovnjak" } },
  { level: 15, minPoints: 400000, name: { de: "Meisternavigator", en: "Master Navigator", sl: "Mojstrski navigator" } },
  { level: 16, minPoints: 600000, name: { de: "Geografie-Guru", en: "Geography Guru", sl: "Geografski guru" } },
  { level: 17, minPoints: 900000, name: { de: "Legendärer Entdecker", en: "Legendary Explorer", sl: "Legendarni raziskovalec" } },
  { level: 18, minPoints: 1300000, name: { de: "Erdkundler", en: "Earth Scholar", sl: "Zemljepisec" } },
  { level: 19, minPoints: 1800000, name: { de: "Weltenmeister", en: "World Master", sl: "Svetovni mojster" } },
  { level: 20, minPoints: 2400000, name: { de: "GeoMaster", en: "GeoMaster", sl: "GeoMaster" } },
];

/**
 * Get the level for a given total points amount
 */
export function getUserLevel(totalPoints: number): Level {
  // Find the highest level the user has reached
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Get level progress information
 */
export function getLevelProgress(totalPoints: number): {
  currentLevel: Level;
  nextLevel: Level | null;
  progress: number; // 0-1
  pointsToNext: number;
  pointsInCurrentLevel: number;
} {
  const currentLevel = getUserLevel(totalPoints);
  const currentLevelIndex = LEVELS.findIndex((l) => l.level === currentLevel.level);
  const nextLevel = currentLevelIndex < LEVELS.length - 1 ? LEVELS[currentLevelIndex + 1] : null;

  if (!nextLevel) {
    // Max level reached
    return {
      currentLevel,
      nextLevel: null,
      progress: 1,
      pointsToNext: 0,
      pointsInCurrentLevel: totalPoints - currentLevel.minPoints,
    };
  }

  const pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
  const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  const progress = pointsInCurrentLevel / pointsNeededForNextLevel;
  const pointsToNext = nextLevel.minPoints - totalPoints;

  return {
    currentLevel,
    nextLevel,
    progress: Math.min(progress, 1),
    pointsToNext,
    pointsInCurrentLevel,
  };
}

/**
 * Check if a level up occurred between two point totals
 */
export function checkLevelUp(
  previousPoints: number,
  newPoints: number
): { leveledUp: boolean; previousLevel: Level; newLevel: Level } {
  const previousLevel = getUserLevel(previousPoints);
  const newLevel = getUserLevel(newPoints);

  return {
    leveledUp: newLevel.level > previousLevel.level,
    previousLevel,
    newLevel,
  };
}

/**
 * Get level name in a specific locale
 */
export function getLevelName(level: Level, locale: string): string {
  return level.name[locale as keyof typeof level.name] || level.name.en;
}
