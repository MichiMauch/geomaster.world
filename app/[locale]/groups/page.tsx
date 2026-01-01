import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { groups, groupMembers, games } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

async function getUserGroups(userId: string) {
  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));

  // Load statistics for each group
  const groupsWithStats = await Promise.all(
    userGroups.map(async (group) => {
      const memberResult = await db
        .select({ value: count() })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

      const gameResult = await db
        .select({
          total: count(),
          active: sql<number>`SUM(CASE WHEN ${games.status} = 'active' THEN 1 ELSE 0 END)`,
        })
        .from(games)
        .where(eq(games.groupId, group.id));

      return {
        ...group,
        memberCount: memberResult[0]?.value ?? 0,
        totalGames: gameResult[0]?.total ?? 0,
        activeGames: Number(gameResult[0]?.active) || 0,
      };
    })
  );

  return groupsWithStats;
}

export default async function GroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("home");
  const userGroups = await getUserGroups(session.user.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Groups Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-text-primary">{t("yourGroups")}</h2>
            <Link href={`/${locale}/groups/new`}>
              <Button variant="primary" size="md">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">{t("createGroup")}</span>
              </Button>
            </Link>
          </div>

          {userGroups.length === 0 ? (
            <Card variant="surface" padding="xl" className="text-center">
              <div className="max-w-md mx-auto">
                {/* Empty State Illustration */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-2 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-body text-text-secondary mb-6">
                  {t("noGroups")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href={`/${locale}/groups/new`}>
                    <Button variant="primary" size="lg" fullWidth>
                      {t("groupCreate")}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/join`}>
                    <Button variant="secondary" size="lg" fullWidth>
                      {t("joinGroup")}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userGroups.map((group, index) => (
                <Link
                  key={group.id}
                  href={`/${locale}/groups/${group.id}`}
                  className="group"
                >
                  <Card
                    variant="interactive"
                    padding="lg"
                    className="h-full animate-card-entrance"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <svg
                        className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-h3 text-text-primary group-hover:text-primary transition-colors mb-3">
                      {group.name}
                    </h3>
                    {/* Statistics */}
                    <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{group.memberCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <span>{group.totalGames} {group.totalGames === 1 ? "Spiel" : "Spiele"}</span>
                      </div>
                      {group.activeGames > 0 && (
                        <div className="flex items-center gap-1.5 text-accent">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{group.activeGames} aktiv</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Join Group Section */}
        <section>
          <Card variant="glass" padding="lg">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <svg
                  className="w-8 h-8 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-h3 text-text-primary mb-2">{t("joinGroup")}</h2>
                <p className="text-body-small text-text-secondary">
                  {t("joinWithCode")}
                </p>
              </div>
              <Link href={`/${locale}/join`}>
                <Button variant="accent" size="lg">
                  {t("enterInviteCode")}
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
