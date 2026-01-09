export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  totalDistance: number;
  totalScore: number;
  roundsPlayed: number;
  completed?: boolean;
  gamesPlayed?: number;
  isMember?: boolean;
}

export interface LeaderboardProps {
  groupId: string;
  gameId?: string;
  blurred?: boolean;
}

export type LeaderboardType = "weekly" | "alltime";
