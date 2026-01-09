export type RankingPeriod = "daily" | "weekly" | "monthly" | "alltime";

export interface RecordRankedGameParams {
  gameId: string;
  userId: string | null;
  guestId: string | null;
  gameType: string;
  totalScore: number;
  averageScore: number;
  totalDistance: number;
}

export interface GetRankingsParams {
  gameType: string; // specific game type OR "overall" for all types combined
  period: RankingPeriod;
  periodKey?: string; // optional, defaults to current period
  limit?: number;
  offset?: number;
  sortBy?: "best" | "total"; // "best" = bestScore (default), "total" = totalScore
}

export interface RankingEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  bestScore: number;
}

export interface GetUserRankParams {
  userId: string;
  gameType: string;
  period: RankingPeriod;
  periodKey?: string;
}

export interface UserRankResult {
  rank: number;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  bestScore: number;
}

export interface TopGameEntry {
  rank: number;
  gameId: string;
  userId: string | null;
  userName: string | null;
  userImage: string | null;
  totalScore: number;
  completedAt: Date;
}

export interface GetTopGamesParams {
  gameType: string;
  period?: RankingPeriod; // optional filter by period (weekly, daily, monthly)
  limit?: number;
  offset?: number;
}

export interface GetUserBestGameRankParams {
  userId: string;
  gameType: string;
  period?: RankingPeriod;
}

export interface UserGameStats {
  gamesCount: number;
  bestScore: number;
  totalScore: number;
  rank: number | null;
}

export interface UserStats {
  totalGames: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
  bestRank: number | null;
  gameTypeBreakdown: Record<string, { games: number; bestScore: number; totalScore: number; avgScore: number }>;
}
