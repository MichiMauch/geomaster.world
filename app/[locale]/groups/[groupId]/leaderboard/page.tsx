import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Leaderboard from "@/components/Leaderboard";
import { db } from "@/lib/db";
import { groups, groupMembers, games } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ groupId: string; locale: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { groupId, locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const group = await db
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .get();

  if (!group) {
    notFound();
  }

  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      )
    )
    .get();

  const isAdmin = membership?.role === "admin";

  if (isAdmin) {
    const currentGame = await db
      .select()
      .from(games)
      .where(eq(games.groupId, groupId))
      .orderBy(desc(games.createdAt))
      .get();

    if (currentGame) {
      await db
        .update(games)
        .set({ leaderboardRevealed: true })
        .where(eq(games.id, currentGame.id));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-h2 text-primary text-center">{group.name}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Leaderboard groupId={groupId} blurred={false} />
      </main>
    </div>
  );
}
