"use client";

import { GAME_TYPES, type GameTypeConfig } from "@/lib/game-types";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface GameTypeSelectorProps {
  selected?: string | null;
  onChange?: (gameType: string) => void;
  excludeImageTypes?: boolean;
  navigationMode?: boolean;
  basePath?: string;
  compact?: boolean;
}

export default function GameTypeSelector({
  selected,
  onChange,
  excludeImageTypes = true,
  navigationMode = false,
  basePath = "/guesser",
  compact = false
}: GameTypeSelectorProps) {
  const locale = useLocale();
  const router = useRouter();

  // Filter game types
  const gameTypes = Object.values(GAME_TYPES).filter((config) => {
    if (excludeImageTypes && config.type === "image") {
      return false;
    }
    return true;
  });

  // Group by type
  const countryTypes = gameTypes.filter((t) => t.type === "country");
  const worldTypes = gameTypes.filter((t) => t.type === "world");

  const getGameTypeName = (config: GameTypeConfig) => {
    const localeKey = locale as "de" | "en" | "sl";
    return config.name[localeKey] || config.name.en;
  };

  const handleClick = (gameTypeId: string) => {
    if (navigationMode) {
      router.push(`/${locale}${basePath}/${gameTypeId}`);
    } else if (onChange) {
      onChange(gameTypeId);
    }
  };

  const GameTypeButton = ({ config }: { config: GameTypeConfig }) => {
    const isSelected = selected === config.id;
    const name = getGameTypeName(config);

    if (compact) {
      return (
        <button
          onClick={() => handleClick(config.id)}
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
            "min-w-[80px] flex-shrink-0",
            isSelected
              ? "bg-primary/10 border-primary"
              : "bg-surface-2 border-transparent",
            "hover:bg-surface-3 hover:border-primary/50",
            "active:scale-95"
          )}
        >
          <span className="text-2xl mb-1">{config.icon}</span>
          <span className={cn(
            "text-xs font-medium text-center leading-tight",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {name}
          </span>
        </button>
      );
    }

    return (
      <button
        onClick={() => handleClick(config.id)}
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-300",
          "min-w-[140px]",
          // 3D Depth Effect
          isSelected
            ? "bg-primary/10 border-primary shadow-[0_4px_12px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1)] -translate-y-1"
            : "bg-surface-2 border-surface-3 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.05)]",
          "hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.15),0_12px_32px_rgba(0,0,0,0.1)]",
          "active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
        )}
      >
        <span className="text-4xl mb-2">{config.icon}</span>
        <span className={cn(
          "text-sm font-medium text-center",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          {name}
        </span>
      </button>
    );
  };

  // Compact mode: single horizontal scrolling row
  if (compact) {
    const allTypes = [...countryTypes, ...worldTypes];
    return (
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2">
          {allTypes.map((config) => (
            <GameTypeButton key={config.id} config={config} />
          ))}
        </div>
      </div>
    );
  }

  // Default: Grid layout with sections
  return (
    <div className="space-y-6">
      {/* Country Types */}
      {countryTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            {locale === "de" ? "Länder" : locale === "en" ? "Countries" : "Države"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {countryTypes.map((config) => (
              <GameTypeButton key={config.id} config={config} />
            ))}
          </div>
        </div>
      )}

      {/* World Types */}
      {worldTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            {locale === "de" ? "Welt-Quiz" : locale === "en" ? "World Quiz" : "Svetovni kviz"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {worldTypes.map((config) => (
              <GameTypeButton key={config.id} config={config} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
