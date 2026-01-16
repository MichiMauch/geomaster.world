"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingInput";
import ConfirmModal from "@/components/ConfirmModal";
import type { NewsItem } from "../types";
import { Pencil, Trash2, ExternalLink, X } from "lucide-react";

interface NewsTabProps {
  news: NewsItem[];
  onAdd: (item: Omit<NewsItem, "id" | "createdAt">) => Promise<boolean>;
  onDelete: (newsId: string) => Promise<void>;
  onUpdate: (newsId: string, data: Partial<NewsItem>) => Promise<boolean>;
}

export function NewsTab({ news, onAdd, onDelete, onUpdate }: NewsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editNews, setEditNews] = useState<NewsItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    newsId: string | null;
    newsTitle: string;
  }>({
    isOpen: false,
    newsId: null,
    newsTitle: "",
  });

  // Form state (only German fields - English is auto-translated)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    link: "",
    linkText: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      link: "",
      linkText: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    // English fields are auto-translated by the API
    const success = await onAdd({
      title: formData.title,
      titleEn: null,
      content: formData.content,
      contentEn: null,
      link: formData.link || null,
      linkText: formData.linkText || null,
      linkTextEn: null,
    });

    if (success) {
      resetForm();
      setShowForm(false);
    }
  };

  const handleEdit = useCallback((item: NewsItem) => {
    setEditNews(item);
  }, []);

  const handleDelete = useCallback((newsId: string, newsTitle: string) => {
    setDeleteModal({ isOpen: true, newsId, newsTitle });
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteModal.newsId) return;
    await onDelete(deleteModal.newsId);
    setDeleteModal({ isOpen: false, newsId: null, newsTitle: "" });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNews) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const success = await onUpdate(editNews.id, {
      title: formData.get("title") as string,
      titleEn: (formData.get("titleEn") as string) || null,
      content: formData.get("content") as string,
      contentEn: (formData.get("contentEn") as string) || null,
      link: (formData.get("link") as string) || null,
      linkText: (formData.get("linkText") as string) || null,
      linkTextEn: (formData.get("linkTextEn") as string) || null,
    });

    if (success) {
      setEditNews(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">News verwalten</h2>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Neue News hinzufügen
            </Button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-surface-2 border border-glass-border space-y-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Neue News erstellen</h3>
            <p className="text-sm text-text-secondary -mt-2 mb-4">
              Die englische Übersetzung wird automatisch erstellt.
            </p>

            <FloatingInput
              label="Titel *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm text-text-secondary mb-1">Text *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-24 px-3 py-2 rounded-lg bg-surface-3 border border-glass-border text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Link (URL)"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
              />
              <FloatingInput
                label="Link-Text"
                value={formData.linkText}
                onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                placeholder="z.B. Mehr erfahren"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" disabled={!formData.title || !formData.content}>
                News erstellen
              </Button>
              <Button type="button" variant="ghost" onClick={() => { resetForm(); setShowForm(false); }}>
                Abbrechen
              </Button>
            </div>
          </form>
        )}

        {/* News table */}
        <div className="rounded-xl bg-surface-2 border border-glass-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-3">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Titel</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Datum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Link</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {news.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                    Noch keine News vorhanden
                  </td>
                </tr>
              ) : (
                news.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-3/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{item.title}</div>
                      <div className="text-sm text-text-secondary line-clamp-1">{item.content}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </a>
                      ) : (
                        <span className="text-text-secondary text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="p-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditNews(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface-1 border border-glass-border shadow-xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-glass-border bg-surface-1">
              <h3 className="text-lg font-semibold text-text-primary">News bearbeiten</h3>
              <button onClick={() => setEditNews(null)} className="p-2 rounded-lg hover:bg-surface-3 text-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Titel (DE) *"
                  name="title"
                  defaultValue={editNews.title}
                  required
                />
                <FloatingInput
                  label="Titel (EN)"
                  name="titleEn"
                  defaultValue={editNews.titleEn || ""}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Text (DE) *</label>
                  <textarea
                    name="content"
                    defaultValue={editNews.content}
                    className="w-full h-24 px-3 py-2 rounded-lg bg-surface-3 border border-glass-border text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Text (EN)</label>
                  <textarea
                    name="contentEn"
                    defaultValue={editNews.contentEn || ""}
                    className="w-full h-24 px-3 py-2 rounded-lg bg-surface-3 border border-glass-border text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Link (URL)"
                  name="link"
                  defaultValue={editNews.link || ""}
                  placeholder="https://..."
                />
                <FloatingInput
                  label="Link-Text (DE)"
                  name="linkText"
                  defaultValue={editNews.linkText || ""}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FloatingInput
                  label="Link-Text (EN)"
                  name="linkTextEn"
                  defaultValue={editNews.linkTextEn || ""}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary">
                  Speichern
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditNews(null)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="News löschen"
        message={`Möchtest du "${deleteModal.newsTitle}" wirklich löschen?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, newsId: null, newsTitle: "" })}
      />
    </>
  );
}
