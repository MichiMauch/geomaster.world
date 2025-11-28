"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  gameCount: number;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  hintEnabled: boolean | null;
  createdAt: string;
  groupCount: number;
  guessCount: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [activeTab, setActiveTab] = useState<"groups" | "users">("groups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isSuperAdmin = session?.user?.email === "michi.mauch@netnode.ch";

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isSuperAdmin) {
      router.push(`/${locale}`);
      return;
    }
    fetchData();
  }, [session, status, isSuperAdmin, router, locale]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        fetch("/api/admin/groups"),
        fetch("/api/admin/users"),
      ]);

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Gruppe "${groupName}" wirklich löschen? Alle Spiele, Runden und Guesses werden ebenfalls gelöscht!`)) {
      return;
    }

    setDeleting(groupId);
    try {
      const response = await fetch("/api/admin/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        toast.success("Gruppe gelöscht");
        setGroups(groups.filter((g) => g.id !== groupId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch (error) {
      toast.error("Fehler beim Löschen");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    if (!confirm(`User "${userName || 'Unbenannt'}" wirklich löschen? Alle Guesses und Gruppenmitgliedschaften werden ebenfalls gelöscht!`)) {
      return;
    }

    setDeleting(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success("User gelöscht");
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Löschen");
      }
    } catch (error) {
      toast.error("Fehler beim Löschen");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleHint = async (userId: string, currentState: boolean | null) => {
    const newState = !currentState;
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hintEnabled: newState }),
      });

      if (response.ok) {
        toast.success(newState ? "Hilfskreis aktiviert" : "Hilfskreis deaktiviert");
        setUsers(users.map((u) =>
          u.id === userId ? { ...u, hintEnabled: newState } : u
        ));
      } else {
        toast.error("Fehler beim Ändern");
      }
    } catch (error) {
      toast.error("Fehler beim Ändern");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-glass-border bg-surface-1/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-h2 text-primary">Admin Dashboard</h1>
            <p className="text-body-small text-text-secondary">Super-Admin Verwaltung</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/admin/locations`}>
              <Button variant="primary" size="md">Orte verwalten</Button>
            </Link>
            <Link href={`/${locale}`}>
              <Button variant="secondary" size="md">Zurück</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="surface" padding="md">
            <p className="text-caption text-text-muted">Gruppen</p>
            <p className="text-h1 text-text-primary">{groups.length}</p>
          </Card>
          <Card variant="surface" padding="md">
            <p className="text-caption text-text-muted">User</p>
            <p className="text-h1 text-text-primary">{users.length}</p>
          </Card>
          <Card variant="surface" padding="md">
            <p className="text-caption text-text-muted">Total Spiele</p>
            <p className="text-h1 text-accent">
              {groups.reduce((sum, g) => sum + g.gameCount, 0)}
            </p>
          </Card>
          <Card variant="surface" padding="md">
            <p className="text-caption text-text-muted">Total Guesses</p>
            <p className="text-h1 text-accent">
              {users.reduce((sum, u) => sum + u.guessCount, 0)}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-glass-border w-fit">
          <button
            onClick={() => setActiveTab("groups")}
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-all duration-200",
              activeTab === "groups"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
            )}
          >
            Gruppen ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-all duration-200",
              activeTab === "users"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
            )}
          >
            User ({users.length})
          </button>
        </div>

        {/* Content */}
        <Card variant="surface" padding="none" className="overflow-hidden">
          {activeTab === "groups" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-2 border-b border-glass-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Name</th>
                    <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Invite Code</th>
                    <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Mitglieder</th>
                    <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Spiele</th>
                    <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/${locale}/groups/${group.id}`}
                          className="font-medium text-text-primary hover:text-primary transition-colors"
                        >
                          {group.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-text-muted font-mono text-sm">
                        {group.inviteCode}
                      </td>
                      <td className="px-6 py-4 text-center text-text-secondary">
                        {group.memberCount}
                      </td>
                      <td className="px-6 py-4 text-center text-text-secondary">
                        {group.gameCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          disabled={deleting === group.id}
                          isLoading={deleting === group.id}
                        >
                          Löschen
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                        Keine Gruppen vorhanden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-2 border-b border-glass-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">User</th>
                    <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Email</th>
                    <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Gruppen</th>
                    <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Guesses</th>
                    <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Hilfskreis</th>
                    <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.image} name={user.name} size="sm" />
                          <span className="font-medium text-text-primary">
                            {user.name || "Unbenannt"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-sm">
                        {user.email}
                        {user.email === "michi.mauch@netnode.ch" && (
                          <Badge variant="error" size="sm" className="ml-2">
                            Admin
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-text-secondary">
                        {user.groupCount}
                      </td>
                      <td className="px-6 py-4 text-center text-text-secondary">
                        {user.guessCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleHint(user.id, user.hintEnabled)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                            user.hintEnabled
                              ? "bg-primary/20 text-primary hover:bg-primary/30"
                              : "bg-surface-3 text-text-muted hover:bg-surface-2"
                          )}
                        >
                          {user.hintEnabled ? "An" : "Aus"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.email !== "michi.mauch@netnode.ch" ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={deleting === user.id}
                            isLoading={deleting === user.id}
                          >
                            Löschen
                          </Button>
                        ) : (
                          <span className="text-text-muted text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                        Keine User vorhanden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
