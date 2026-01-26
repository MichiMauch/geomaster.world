import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

// NextAuth Tables
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name"),
  nickname: text("nickname"), // Display name for rankings (optional)
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  password: text("password"), // Hashed password for email/password auth (null for OAuth-only users)
  hintEnabled: integer("hintEnabled", { mode: "boolean" }).default(false),
  isSuperAdmin: integer("isSuperAdmin", { mode: "boolean" }).default(false),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// Game Tables

// Groups
export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("inviteCode").notNull().unique(),
  ownerId: text("ownerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationsPerRound: integer("locationsPerRound").notNull().default(5), // How many locations per round
  timeLimitSeconds: integer("timeLimitSeconds"), // null = no limit
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Group Members
export const groupMembers = sqliteTable(
  "groupMembers",
  {
    groupId: text("groupId")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
    joinedAt: integer("joinedAt", { mode: "timestamp" }).notNull(),
  },
  (gm) => [primaryKey({ columns: [gm.groupId, gm.userId] })]
);

// Locations (global - shared across all groups)
export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameDe: text("name_de"),
  nameEn: text("name_en"),
  nameSl: text("name_sl"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  country: text("country").default("Switzerland"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).default("medium"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// World Locations (for world quiz categories)
export const worldLocations = sqliteTable("worldLocations", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  category: text("category").notNull(), // "highest-mountains", "capitals", "famous-places"
  name: text("name").notNull(),
  nameDe: text("name_de"),
  nameEn: text("name_en"),
  nameSl: text("name_sl"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  countryCode: text("countryCode"), // ISO code (e.g., "NP", "US")
  additionalInfo: text("additionalInfo"), // JSON for extra info (elevation, etc.)
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).default("medium"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Games
export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  groupId: text("groupId")
    .references(() => groups.id, { onDelete: "cascade" }), // NULLABLE for training games
  userId: text("userId")
    .references(() => users.id, { onDelete: "cascade" }), // Owner for training games
  mode: text("mode", { enum: ["group", "training", "ranked", "duel"] }).notNull().default("group"), // Game mode
  name: text("name"), // Game name (optional, set by admin)
  country: text("country").notNull().default("switzerland"), // Country key (switzerland, slovenia) - legacy
  gameType: text("gameType"), // New: "country:switzerland", "world:capitals" etc. null = use country field
  locationsPerRound: integer("locationsPerRound").notNull().default(5), // How many locations per round for this game
  timeLimitSeconds: integer("timeLimitSeconds"), // null = no limit
  scoringVersion: integer("scoringVersion").notNull().default(1), // Scoring algorithm version (1 = distance only, 2 = time-based). Default to v1 for safety; ranked games set v2 explicitly
  weekNumber: integer("weekNumber"), // Legacy: ISO week (optional for backwards compatibility)
  year: integer("year"), // Legacy: year (optional for backwards compatibility)
  status: text("status", { enum: ["active", "completed"] }).notNull().default("active"),
  currentRound: integer("currentRound").notNull().default(1), // Currently released round (1 = only round 1 playable)
  leaderboardRevealed: integer("leaderboardRevealed", { mode: "boolean" }).notNull().default(false), // Admin can reveal leaderboard
  // Anti-cheat: Server-side round tracking
  activeLocationIndex: integer("activeLocationIndex").default(1), // Which location is currently being played (1-5)
  locationStartedAt: integer("locationStartedAt"), // Unix timestamp (ms) when current location started
  // Duel-specific fields
  duelSeed: text("duelSeed"), // Seed for seededShuffle in duel mode (null for non-duel games)
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Game Rounds
export const gameRounds = sqliteTable("gameRounds", {
  id: text("id").primaryKey(),
  gameId: text("gameId")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  roundNumber: integer("roundNumber").notNull(), // Which round/day (1, 2, 3...)
  locationIndex: integer("locationIndex").notNull().default(1), // Position within round (1-N)
  locationId: text("locationId").notNull(), // No FK constraint - can reference locations OR worldLocations
  locationSource: text("locationSource", { enum: ["locations", "worldLocations", "imageLocations", "panoramaLocations"] }).notNull().default("locations"),
  country: text("country").notNull().default("switzerland"), // Country key for this round (can differ from game.country)
  gameType: text("gameType"), // Full game type ID for this round (e.g., "country:switzerland", "world:capitals")
  timeLimitSeconds: integer("timeLimitSeconds"), // Time limit for this round (null = no limit)
});

// Player Guesses
export const guesses = sqliteTable("guesses", {
  id: text("id").primaryKey(),
  gameRoundId: text("gameRoundId")
    .notNull()
    .references(() => gameRounds.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  latitude: real("latitude"), // nullable for timeouts
  longitude: real("longitude"), // nullable for timeouts
  distanceKm: real("distanceKm").notNull(),
  timeSeconds: integer("timeSeconds"), // nullable, how long it took
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Image Locations (for image-based maps like garden, office, etc.)
export const imageLocations = sqliteTable("imageLocations", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  imageMapId: text("imageMapId").notNull(), // "garten", "buero", etc.
  name: text("name").notNull(),
  nameDe: text("name_de"),
  nameEn: text("name_en"),
  nameSl: text("name_sl"),
  x: real("x").notNull(), // Pixel X-Koordinate
  y: real("y").notNull(), // Pixel Y-Koordinate
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).default("medium"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Panorama Locations (for Mapillary Street View style games)
export const panoramaLocations = sqliteTable("panoramaLocations", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  mapillaryImageKey: text("mapillaryImageKey").notNull(), // Mapillary image key
  name: text("name").notNull(), // Admin-only, not shown during gameplay (GeoGuessr experience)
  nameDe: text("name_de"),
  nameEn: text("name_en"),
  nameSl: text("name_sl"),
  latitude: real("latitude").notNull(), // Actual coordinates (for scoring)
  longitude: real("longitude").notNull(),
  heading: real("heading"), // Camera direction 0-360 degrees (0 = North)
  pitch: real("pitch"), // Camera tilt -90 to +90 degrees
  countryCode: text("countryCode"), // ISO code (e.g., "CH", "FR")
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).default("medium"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// User Stats (for training mode persistence)
export const userStats = sqliteTable("userStats", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameType: text("gameType").notNull(), // e.g., "country:switzerland", "world:capitals"
  totalGames: integer("totalGames").notNull().default(0),
  totalRounds: integer("totalRounds").notNull().default(0),
  totalDistance: real("totalDistance").notNull().default(0),
  totalScore: integer("totalScore").notNull().default(0),
  bestScore: integer("bestScore").notNull().default(0), // best single round score
  averageDistance: real("averageDistance").notNull().default(0),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Ranked Game Results (stores each completed ranked game)
export const rankedGameResults = sqliteTable("rankedGameResults", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  gameId: text("gameId").notNull().references(() => games.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }), // nullable for guest players
  guestId: text("guestId"), // for anonymous players (nanoid before login)
  gameType: text("gameType").notNull(), // "country:switzerland", "world:capitals", etc.
  totalScore: integer("totalScore").notNull(), // Sum of all 5 location scores
  averageScore: real("averageScore").notNull(), // totalScore / 5
  totalDistance: real("totalDistance").notNull(), // Sum of distances in km
  completedAt: integer("completedAt", { mode: "timestamp" }).notNull(),
});

// Rankings aggregation - materialized view for fast leaderboard queries
export const rankings = sqliteTable("rankings", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameType: text("gameType").notNull(), // specific game type OR "overall" for combined
  period: text("period", { enum: ["daily", "weekly", "monthly", "alltime"] }).notNull(),
  periodKey: text("periodKey").notNull(), // "2025-12-24", "2025-W52", "2025-12", "alltime"

  // Aggregated stats
  totalScore: integer("totalScore").notNull().default(0),
  totalGames: integer("totalGames").notNull().default(0),
  averageScore: real("averageScore").notNull().default(0), // per round average
  bestScore: integer("bestScore").notNull().default(0), // best single game score

  // Denormalized for display
  userName: text("userName"),
  userImage: text("userImage"),

  // Ranking
  rank: integer("rank"), // NULL until calculated

  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Countries (for dynamic country game types)
export const countries = sqliteTable("countries", {
  id: text("id").primaryKey(), // z.B. "switzerland", "germany"
  name: text("name").notNull(), // "Schweiz"
  nameEn: text("name_en"), // "Switzerland"
  nameSl: text("name_sl"), // "Švica"
  icon: text("icon").notNull(), // "🇨🇭"
  geoJsonData: text("geojson_data"), // GeoJSON als JSON-String
  // Bilder für die Spieleseite
  landmarkImage: text("landmark_image"), // z.B. "/images/stephansdom.webp"
  backgroundImage: text("background_image"), // z.B. "/images/austria.webp"
  cardImage: text("card_image"), // z.B. "/images/countries/switzerland-card.webp"
  flagImage: text("flag_image"), // z.B. "/images/countries/switzerland-flag.gif"
  // Karteneinstellungen
  centerLat: real("center_lat").notNull(),
  centerLng: real("center_lng").notNull(),
  defaultZoom: integer("default_zoom").notNull().default(8),
  minZoom: integer("min_zoom").notNull().default(7),
  // Bounds
  boundsNorth: real("bounds_north"),
  boundsSouth: real("bounds_south"),
  boundsEast: real("bounds_east"),
  boundsWest: real("bounds_west"),
  // Scoring
  timeoutPenalty: integer("timeout_penalty").notNull().default(300), // km
  scoreScaleFactor: integer("score_scale_factor").notNull().default(80), // km
  // Status
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// World Quiz Types (for dynamic world quiz categories)
export const worldQuizTypes = sqliteTable("worldQuizTypes", {
  id: text("id").primaryKey(), // z.B. "capitals", "highest-mountains"
  name: text("name").notNull(), // "Hauptstädte"
  nameEn: text("name_en"), // "World Capitals"
  nameSl: text("name_sl"), // "Prestolnice"
  icon: text("icon").notNull(), // "🏛️"
  description: text("description"), // "Erkunde berühmte Hauptstädte der Welt"
  descriptionEn: text("description_en"), // "Explore famous world capitals"
  // Bilder für die Spieleseite
  landmarkImage: text("landmark_image"), // z.B. "/images/capitals-landmark.webp"
  backgroundImage: text("background_image"), // z.B. "/images/capitals-bg.webp"
  // Karteneinstellungen (World Map defaults)
  centerLat: real("center_lat").notNull().default(20),
  centerLng: real("center_lng").notNull().default(0),
  defaultZoom: integer("default_zoom").notNull().default(2),
  minZoom: integer("min_zoom").notNull().default(1),
  // Scoring
  timeoutPenalty: integer("timeout_penalty").notNull().default(5000), // km
  scoreScaleFactor: integer("score_scale_factor").notNull().default(3000), // km
  // Status
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Panorama Types (for Street View style games)
export const panoramaTypes = sqliteTable("panoramaTypes", {
  id: text("id").primaryKey(), // z.B. "world"
  name: text("name").notNull(), // "Street View Welt"
  nameEn: text("name_en"), // "Street View World"
  nameSl: text("name_sl"), // "Ulični pogled Svet"
  icon: text("icon").notNull(), // "📷"
  // Bilder für die Spieleseite
  landmarkImage: text("landmark_image"), // z.B. "/images/streetview.webp"
  backgroundImage: text("background_image"), // z.B. "/images/streetview-bg.webp"
  // Karteneinstellungen (World Map defaults)
  centerLat: real("center_lat").notNull().default(20),
  centerLng: real("center_lng").notNull().default(0),
  defaultZoom: integer("default_zoom").notNull().default(2),
  minZoom: integer("min_zoom").notNull().default(1),
  // Scoring
  timeoutPenalty: integer("timeout_penalty").notNull().default(5000), // km
  scoreScaleFactor: integer("score_scale_factor").notNull().default(3000), // km
  // Panorama-spezifisch
  defaultTimeLimitSeconds: integer("default_time_limit_seconds").notNull().default(60),
  // Status
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Activity Logs (for admin dashboard)
export const activityLogs = sqliteTable("activityLogs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  level: text("level", { enum: ["debug", "info", "warn", "error"] }).notNull(),
  category: text("category", { enum: ["auth", "game", "admin", "system"] }).notNull(),
  action: text("action").notNull(), // e.g., "auth.login", "game.completed", "admin.user.deleted"
  userId: text("userId").references(() => users.id, { onDelete: "set null" }), // Who triggered the action (nullable for system events)
  targetId: text("targetId"), // The affected entity ID (user, game, group, etc.)
  targetType: text("targetType"), // "user", "game", "group", "location", etc.
  details: text("details"), // JSON string for additional context
  metadata: text("metadata"), // JSON string for request info (IP, user agent, etc.)
});

// News Items (for landing page and guesser announcements)
export const newsItems = sqliteTable("newsItems", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  title: text("title").notNull(), // German title
  titleEn: text("title_en"), // English title
  content: text("content").notNull(), // German content
  contentEn: text("content_en"), // English content
  link: text("link"), // Optional URL
  linkText: text("link_text"), // German link text
  linkTextEn: text("link_text_en"), // English link text
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Registration Rate Limiting
export const registrationAttempts = sqliteTable("registrationAttempts", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  ip: text("ip").notNull(),
  attemptedAt: integer("attemptedAt", { mode: "timestamp" }).notNull(),
  success: integer("success", { mode: "boolean" }).notNull().default(false),
});

// User Streaks (daily play tracking)
export const userStreaks = sqliteTable("userStreaks", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("currentStreak").notNull().default(0), // Current consecutive days
  longestStreak: integer("longestStreak").notNull().default(0), // Best streak ever
  lastPlayedDate: text("lastPlayedDate"), // ISO date string (YYYY-MM-DD)
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Duel Results (completed 1v1 duels)
export const duelResults = sqliteTable("duelResults", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  duelSeed: text("duelSeed").notNull(), // Seed used for location order
  gameType: text("gameType").notNull(), // "country:switzerland", etc.
  // Challenger (Spieler A)
  challengerId: text("challengerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengerGameId: text("challengerGameId").notNull().references(() => games.id, { onDelete: "cascade" }),
  challengerScore: integer("challengerScore").notNull(),
  challengerTime: integer("challengerTime").notNull(), // Total time in seconds
  // Accepter (Spieler B)
  accepterId: text("accepterId").notNull().references(() => users.id, { onDelete: "cascade" }),
  accepterGameId: text("accepterGameId").notNull().references(() => games.id, { onDelete: "cascade" }),
  accepterScore: integer("accepterScore").notNull(),
  accepterTime: integer("accepterTime").notNull(), // Total time in seconds
  // Winner
  winnerId: text("winnerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Duel Stats (aggregated per user per game type)
export const duelStats = sqliteTable("duelStats", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameType: text("gameType").notNull(), // "country:switzerland", etc.
  totalDuels: integer("totalDuels").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  winRate: real("winRate").notNull().default(0), // Calculated: wins / totalDuels
  rank: integer("rank"), // Leaderboard position (null until calculated)
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Notifications (in-app notifications for users)
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "duel_completed", "duel_challenge_received", etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // URL to navigate to when clicked
  metadata: text("metadata"), // JSON string for extra data (duelId, etc.)
  isRead: integer("isRead", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

// Types
export type UserStreak = typeof userStreaks.$inferSelect;
export type RegistrationAttempt = typeof registrationAttempts.$inferSelect;
export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type WorldLocation = typeof worldLocations.$inferSelect;
export type ImageLocation = typeof imageLocations.$inferSelect;
export type PanoramaLocation = typeof panoramaLocations.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameRound = typeof gameRounds.$inferSelect;
export type Guess = typeof guesses.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type RankedGameResult = typeof rankedGameResults.$inferSelect;
export type Ranking = typeof rankings.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type WorldQuizType = typeof worldQuizTypes.$inferSelect;
export type PanoramaType = typeof panoramaTypes.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewsItem = typeof newsItems.$inferSelect;
export type DuelResult = typeof duelResults.$inferSelect;
export type DuelStat = typeof duelStats.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
