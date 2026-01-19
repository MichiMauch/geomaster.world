import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import type { User } from "../types";

interface UseUserAdminReturn {
  users: User[];
  loading: boolean;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  deleteUser: (userId: string, userName: string | null) => Promise<void>;
  toggleHint: (userId: string, currentState: boolean | null) => Promise<void>;
  toggleSuperAdmin: (userId: string, currentState: boolean | null) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export function useUserAdmin(): UseUserAdminReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Fehler beim Laden der User");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string, userName: string | null) => {
    if (!confirm(`User "${userName || 'Unbenannt'}" wirklich löschen? Alle Guesses und Gruppenmitgliedschaften werden ebenfalls gelöscht!`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success("User gelöscht");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  const toggleHint = useCallback(async (userId: string, currentState: boolean | null) => {
    const newState = !currentState;
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, hintEnabled: newState }),
      });

      if (response.ok) {
        toast.success(newState ? "Hilfskreis aktiviert" : "Hilfskreis deaktiviert");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, hintEnabled: newState } : u))
        );
      } else {
        toast.error("Fehler beim Ändern");
      }
    } catch {
      toast.error("Fehler beim Ändern");
    }
  }, []);

  const toggleSuperAdmin = useCallback(async (userId: string, currentState: boolean | null) => {
    const newState = !currentState;
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isSuperAdmin: newState }),
      });

      if (response.ok) {
        toast.success(newState ? "Admin-Rechte erteilt" : "Admin-Rechte entzogen");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isSuperAdmin: newState } : u))
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Ändern");
      }
    } catch {
      toast.error("Fehler beim Ändern");
    }
  }, []);

  return {
    users,
    loading,
    setUsers,
    deleteUser,
    toggleHint,
    toggleSuperAdmin,
    fetchUsers,
  };
}
