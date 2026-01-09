"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { WorldQuizTypeForm } from "./world-quiz-types/WorldQuizTypeForm";
import { WorldQuizTypeTable } from "./world-quiz-types/WorldQuizTypeTable";
import { WorldQuizTypeEditModal } from "./world-quiz-types/WorldQuizTypeEditModal";
import type { WorldQuizType } from "../types";

interface WorldQuizTypesTabProps {
  worldQuizTypes: WorldQuizType[];
  onAdd: (quizType: Omit<WorldQuizType, "createdAt" | "locationCount">) => Promise<boolean>;
  onDelete: (quizTypeId: string) => Promise<void>;
  onUpdate: (quizTypeId: string, data: Partial<WorldQuizType>) => Promise<boolean>;
}

export function WorldQuizTypesTab({ worldQuizTypes, onAdd, onDelete, onUpdate }: WorldQuizTypesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editQuizType, setEditQuizType] = useState<WorldQuizType | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    quizTypeId: string | null;
    quizTypeName: string;
  }>({
    isOpen: false,
    quizTypeId: null,
    quizTypeName: "",
  });

  const handleEdit = useCallback((quizType: WorldQuizType) => {
    setEditQuizType(quizType);
  }, []);

  const handleDelete = useCallback((quizTypeId: string, quizTypeName: string) => {
    setDeleteModal({ isOpen: true, quizTypeId, quizTypeName });
  }, []);

  const handleToggleActive = useCallback(async (quizType: WorldQuizType) => {
    await onUpdate(quizType.id, { isActive: !quizType.isActive });
  }, [onUpdate]);

  const handleDeleteConfirm = async () => {
    if (!deleteModal.quizTypeId) return;
    await onDelete(deleteModal.quizTypeId);
    setDeleteModal({ isOpen: false, quizTypeId: null, quizTypeName: "" });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">Welt-Quiz-Typen verwalten</h2>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Neuen Typ hinzufügen
            </Button>
          )}
        </div>

        {/* Add quiz type form */}
        {showForm && (
          <WorldQuizTypeForm onAdd={onAdd} onCancel={() => setShowForm(false)} />
        )}

        {/* Quiz types table */}
        <WorldQuizTypeTable
          worldQuizTypes={worldQuizTypes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Edit Modal */}
      {editQuizType && (
        <WorldQuizTypeEditModal
          quizType={editQuizType}
          onSave={onUpdate}
          onClose={() => setEditQuizType(null)}
        />
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Welt-Quiz-Typ löschen"
        message={`Möchtest du "${deleteModal.quizTypeName}" wirklich löschen? Alle zugehörigen Orte bleiben erhalten.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, quizTypeId: null, quizTypeName: "" })}
      />
    </>
  );
}
