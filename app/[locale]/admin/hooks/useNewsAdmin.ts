import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import type { NewsItem } from "../types";

interface UseNewsAdminReturn {
  news: NewsItem[];
  loading: boolean;
  addNews: (item: Omit<NewsItem, "id" | "createdAt">) => Promise<boolean>;
  deleteNews: (newsId: string) => Promise<void>;
  updateNews: (newsId: string, data: Partial<NewsItem>) => Promise<boolean>;
  refreshNews: () => Promise<void>;
}

export function useNewsAdmin(): UseNewsAdminReturn {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Fehler beim Laden der News");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (error) {
      console.error("Error refreshing news:", error);
    }
  }, []);

  const addNews = useCallback(async (
    item: Omit<NewsItem, "id" | "createdAt">
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Fehler beim Erstellen");
        return false;
      }

      toast.success("News hinzugefügt");
      await refreshNews();
      return true;
    } catch {
      toast.error("Fehler beim Erstellen");
      return false;
    }
  }, [refreshNews]);

  const deleteNews = useCallback(async (newsId: string) => {
    try {
      const response = await fetch(`/api/news/${newsId}`, { method: "DELETE" });

      if (response.ok) {
        toast.success("News gelöscht");
        setNews((prev) => prev.filter((n) => n.id !== newsId));
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }, []);

  const updateNews = useCallback(async (newsId: string, data: Partial<NewsItem>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        toast.error("Fehler beim Aktualisieren");
        return false;
      }

      toast.success("News aktualisiert");
      await refreshNews();
      return true;
    } catch {
      toast.error("Fehler beim Aktualisieren");
      return false;
    }
  }, [refreshNews]);

  // Fetch on mount
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return {
    news,
    loading,
    addNews,
    deleteNews,
    updateNews,
    refreshNews,
  };
}
