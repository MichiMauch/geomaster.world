import type { GameTypeConfig } from "@/lib/game-types";

export interface GameTypeSelectorWithLeadersProps {
  selected?: string | null;
  onChange?: (gameType: string) => void;
  excludeImageTypes?: boolean;
  navigationMode?: boolean;
  basePath?: string;
}

export interface TopPlayer {
  rank: number;
  userName: string | null;
  bestScore: number;
}

export interface TopPlayersMap {
  [gameType: string]: TopPlayer[];
}

export interface GameTypeData {
  countryTypes: GameTypeConfig[];
  worldTypes: GameTypeConfig[];
  allGameTypes: GameTypeConfig[];
}
