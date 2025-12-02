/**
 * Location utilities for multi-language support
 */

export interface LocalizedLocation {
  name: string;
  nameDe?: string | null;
  nameEn?: string | null;
  nameSl?: string | null;
}

/**
 * Get the localized name for a location based on the current locale.
 * Falls back to the default `name` field if no translation exists.
 */
export function getLocalizedName(
  location: LocalizedLocation,
  locale: string
): string {
  switch (locale) {
    case "de":
      return location.nameDe || location.name;
    case "en":
      return location.nameEn || location.name;
    case "sl":
      return location.nameSl || location.name;
    default:
      return location.name;
  }
}
