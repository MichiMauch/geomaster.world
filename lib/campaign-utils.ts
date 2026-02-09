const CAMPAIGN_CONTEXT_KEY = "campaignContext";

export interface CampaignContext {
  levelId: number;
  type: string;
  config: Record<string, unknown>;
  winCondition: Record<string, unknown>;
  reward: Record<string, unknown>;
}

export function setCampaignContext(ctx: CampaignContext): void {
  try {
    sessionStorage.setItem(CAMPAIGN_CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    // sessionStorage unavailable
  }
}

export function getCampaignContext(): CampaignContext | null {
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CampaignContext;
  } catch {
    return null;
  }
}

export function clearCampaignContext(): void {
  try {
    sessionStorage.removeItem(CAMPAIGN_CONTEXT_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

export function isCampaignMode(): boolean {
  return getCampaignContext() !== null;
}

/**
 * Returns the ISO country codes (lowercase) belonging to a campaign region.
 * Returns null for "world" (no filtering needed).
 */
export function getCountryCodesForRegion(region: string): string[] | null {
  if (region === "world") return null;

  const regionMap: Record<string, string[]> = {
    europe: [
      "al", "ad", "at", "ba", "be", "bg", "by", "ch", "cy", "cz",
      "de", "dk", "ee", "es", "fi", "fr", "gb", "ge", "gr", "hr",
      "hu", "ie", "is", "it", "li", "lt", "lu", "lv", "mc", "md",
      "me", "mk", "mt", "nl", "no", "pl", "pt", "ro", "rs", "ru",
      "se", "si", "sk", "sm", "tr", "ua", "va", "xk",
    ],
    asia: [
      "af", "am", "az", "bd", "bt", "cn", "ge", "in", "id", "ir",
      "iq", "jp", "kz", "kg", "kh", "kp", "kr", "la", "lk", "mm",
      "mn", "my", "np", "pk", "ph", "sg", "sy", "th", "tj", "tm",
      "tw", "uz", "vn",
    ],
    south_america: [
      "ar", "bo", "br", "cl", "co", "ec", "gy", "pe", "py", "sr",
      "uy", "ve",
    ],
    north_america: ["ca", "mx", "us"],
    africa: [
      "ao", "bf", "bi", "bj", "bw", "cd", "cf", "cg", "ci", "cm",
      "cv", "dj", "dz", "eg", "er", "et", "ga", "gh", "gm", "gn",
      "gq", "gw", "ke", "km", "lr", "ls", "ly", "ma", "mg", "ml",
      "mr", "mu", "mw", "mz", "na", "ne", "ng", "rw", "sc", "sd",
      "sl", "sn", "so", "ss", "st", "sz", "td", "tg", "tn", "tz",
      "ug", "za", "zm", "zw",
    ],
    oceania: [
      "au", "fj", "fm", "ki", "mh", "nr", "nz", "pg", "pw", "sb",
      "to", "tv", "vu", "ws",
    ],
    middle_east: [
      "ae", "bh", "il", "iq", "ir", "jo", "kw", "lb", "om", "qa",
      "sa", "sy", "ye",
    ],
    southeast_asia: ["id", "kh", "la", "mm", "my", "ph", "sg", "th", "vn"],
    central_america: [
      "bz", "cr", "gt", "hn", "ni", "pa", "sv",
    ],
    caribbean: [
      "bb", "bs", "cu", "do", "ht", "jm", "tt",
    ],
  };

  return regionMap[region] ?? null;
}
