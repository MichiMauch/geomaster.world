export interface RankingEntry {
  rank: number;
  userName: string | null;
  userImage?: string | null;
  bestScore: number;
  totalScore?: number;
  totalGames?: number;
}

export type TabType = "weekly" | "best" | "total";

export interface UserGameStats {
  gamesCount: number;
  bestScore: number;
  totalScore: number;
  rank: number | null;
}
