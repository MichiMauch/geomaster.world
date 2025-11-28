import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { groups, groupMembers, games } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Leaderboard from "@/components/Leaderboard";
import { Badge } from "@/components/ui/Badge";
import { getTranslations } from "next-intl/server";

export default async function GameLeaderboardPage({
  params,
}: {
  params: Promise<{ groupId: string; gameId: string; locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { groupId, gameId, locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, session.user.id))
    )
    .get();

  if (!membership) {
    notFound();
  }

  const group = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .get();

  if (!group) {
    notFound();
  }

  const game = await db
    .select()
    .from(games)
    .where(and(eq(games.id, gameId), eq(games.groupId, groupId)))
    .get();

  if (!game) {
    notFound();
  }

  const t = await getTranslations("history");
  const tCommon = await getTranslations("common");

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === "de" ? "de-CH" : locale === "sl" ? "sl-SI" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/${locale}/groups/${groupId}/history`}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{tCommon("back")}</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-h1 text-text-primary">
              {t("week", { week: game.weekNumber, year: game.year })}
            </h1>
            <Badge
              variant={game.status === "completed" ? "success" : "primary"}
              size="sm"
            >
              {game.status === "completed" ? t("completed") : t("active")}
            </Badge>
          </div>
          <p className="text-text-secondary">{formatDate(game.createdAt)}</p>
        </div>

        <Leaderboard groupId={groupId} gameId={gameId} blurred={false} />
      </main>
    </div>
  );
}
