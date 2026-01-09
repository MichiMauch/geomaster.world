import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import type { Group } from "../types";

interface UseGroupAdminReturn {
  groups: Group[];
  loading: boolean;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  deleteGroup: (groupId: string, groupName: string) => Promise<void>;
  fetchGroups: () => Promise<void>;
}

export function useGroupAdmin(): UseGroupAdminReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Fehler beim Laden der Gruppen");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteGroup = useCallback(async (groupId: string, groupName: string) => {
    if (!confirm(`Gruppe "${groupName}" wirklich löschen? Alle Spiele, Runden und Guesses werden ebenfalls gelöscht!`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        toast.success("Gruppe gelöscht");
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  return {
    groups,
    loading,
    setGroups,
    deleteGroup,
    fetchGroups,
  };
}
