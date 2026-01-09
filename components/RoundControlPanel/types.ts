export interface Winner {
  userName: string;
  userImage: string | null;
  totalDistance: number;
}

export interface RoundControlPanelProps {
  gameId: string;
  groupId: string;
  currentRound: number;
  locationsPerRound?: number;
  isAdmin: boolean;
  userCompletedRounds?: number;
  gameStatus: "active" | "completed";
  gameName?: string;
  currentGameType: string;
}

export interface GameTypeInfo {
  id: string;
  icon: string;
}
