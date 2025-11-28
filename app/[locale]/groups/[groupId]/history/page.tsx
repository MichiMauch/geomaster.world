import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { groups, groupMembers, games } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ groupId: string; locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { groupId, locale } = await params;

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

  const allGames = await db
    .select()
    .from(games)
    .where(eq(games.groupId, groupId))
    .orderBy(desc(games.createdAt));

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
            href={`/${locale}/groups/${groupId}`}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{tCommon("back")}</span>
          </Link>
          <h1 className="text-h3 text-text-primary">{group.name}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-h2 text-text-primary mb-6">{t("title")}</h2>

        {allGames.length === 0 ? (
          <Card variant="surface" padding="xl" className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-3 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-secondary">{t("noGames")}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {allGames.map((game, index) => (
              <Link
                key={game.id}
                href={`/${locale}/groups/${groupId}/history/${game.id}`}
                className="block group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card variant="interactive" padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {t("week", { week: game.weekNumber, year: game.year })}
                      </p>
                      <p className="text-body-small text-text-secondary">
                        {formatDate(game.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={game.status === "completed" ? "success" : "primary"}
                        size="sm"
                      >
                        {game.status === "completed" ? t("completed") : t("active")}
                      </Badge>
                      <svg
                        className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
