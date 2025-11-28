import { getServerSession } from "next-auth";
import { authOptions, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

async function getUserGroups(userId: string) {
  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      locationsPerRound: groups.locationsPerRound,
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));

  return userGroups;
}

export default async function Home({
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
  const tCommon = await getTranslations("common");
  const userGroups = await getUserGroups(session.user.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20">
              <svg
                viewBox="0 0 32 32"
                className="w-6 h-6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13 8h6v6h6v6h-6v6h-6v-6H7v-6h6V8z" fill="white" />
              </svg>
            </div>
            <h1 className="text-h3 text-text-primary hidden sm:block">{t("title")}</h1>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isSuperAdmin(session.user.email) && (
              <Link href={`/${locale}/admin`}>
                <Button variant="ghost" size="sm">
                  {tCommon("admin")}
                </Button>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="text-body-small text-text-secondary hidden sm:block">
                {session.user.name}
              </span>
              <Avatar
                src={session.user.image}
                name={session.user.name}
                size="md"
              />
            </div>
          </div>
        </div>
      </header>

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
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-lg">
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
                    <h3 className="text-h3 text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    <Badge variant="default" size="sm">
                      {t("locationsPerRound", { count: group.locationsPerRound })}
                    </Badge>
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
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
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
