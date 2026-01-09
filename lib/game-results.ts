/**
 * Game Results Helper Functions
 * For the Game Over screen with stars, ranks, and titles
 */

export interface GameRank {
  title: string;
  titleKey: string; // for i18n
}

export interface GameTitle {
  text: string;
  titleKey: string; // for i18n
}

/**
 * Get number of filled stars (out of 5) based on score
 * Max possible score per game: 500 (5 rounds × 100 points max)
 */
export function getFilledStars(score: number): number {
  if (score >= 450) return 5; // 90%+ - Perfect
  if (score >= 400) return 4; // 80%+ - Excellent
  if (score >= 300) return 3; // 60%+ - Good
  if (score >= 200) return 2; // 40%+ - Okay
  return 1; // Try again
}

/**
 * Get rank/title based on score
 */
export function getRank(score: number): GameRank {
  if (score >= 450) return { title: "GeoMaster", titleKey: "rankGeoMaster" };
  if (score >= 400) return { title: "Experte", titleKey: "rankExpert" };
  if (score >= 300) return { title: "Entdecker", titleKey: "rankExplorer" };
  if (score >= 200) return { title: "Reisender", titleKey: "rankTraveler" };
  return { title: "Tourist", titleKey: "rankTourist" };
}

/**
 * Get celebratory title based on star count
 */
export function getTitle(stars: number): GameTitle {
  if (stars >= 5) return { text: "Perfekt!", titleKey: "titlePerfect" };
  if (stars >= 4) return { text: "Unglaublich!", titleKey: "titleAmazing" };
  if (stars >= 3) return { text: "Starke Leistung!", titleKey: "titleGreat" };
  if (stars >= 2) return { text: "Gut gemacht!", titleKey: "titleGood" };
  return { text: "Versuch's nochmal!", titleKey: "titleTryAgain" };
}

/**
 * Get background image for game type
 */
export function getGameTypeImage(gameType: string): string {
  if (gameType.startsWith("country:")) {
    const country = gameType.split(":")[1];
    // Check if country-specific image exists
    const countryImages: Record<string, string> = {
      switzerland: "/images/country-ch.webp",
      germany: "/images/country-de.webp",
      austria: "/images/country-at.webp",
      slovenia: "/images/country-sl.webp",
    };
    return countryImages[country] || "/images/countryquiz.webp";
  }
  if (gameType.startsWith("world:")) return "/images/worldquiz.webp";
  if (gameType.startsWith("panorama:")) return "/images/streetviewquiz.webp";
  if (gameType.startsWith("image:")) return "/images/specialquiz.webp";
  return "/images/globe.svg";
}

/**
 * Check if score qualifies for confetti
 */
export function shouldShowConfetti(score: number): boolean {
  return getFilledStars(score) >= 4;
}

/**
 * Get highscore context message
 */
export function getHighscoreContext(
  currentScore: number,
  bestScore: number | null
): { isNewHighscore: boolean; pointsToHighscore: number } {
  if (!bestScore || currentScore > bestScore) {
    return { isNewHighscore: true, pointsToHighscore: 0 };
  }
  return {
    isNewHighscore: false,
    pointsToHighscore: bestScore - currentScore,
  };
}
