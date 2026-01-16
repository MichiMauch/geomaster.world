"use client";

import { NewsTab } from "../../components";
import { useNewsAdmin } from "../../hooks/useNewsAdmin";

export default function NewsPage() {
  const { news, loading, addNews, deleteNews, updateNews } = useNewsAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">News</h1>
        <p className="text-text-secondary">News und Ankündigungen verwalten</p>
      </div>

      <NewsTab
        news={news}
        onAdd={addNews}
        onDelete={deleteNews}
        onUpdate={updateNews}
      />
    </div>
  );
}
