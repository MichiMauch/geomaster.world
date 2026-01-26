"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import ConfirmModal from "@/components/ConfirmModal";
import { cn } from "@/lib/utils";
import type { User } from "../types";

interface UsersTabProps {
  users: User[];
  onDelete: (userId: string) => Promise<void>;
  onToggleHint: (userId: string, currentState: boolean | null) => Promise<void>;
  onToggleSuperAdmin: (userId: string, currentState: boolean | null) => Promise<void>;
  deletingId: string | null;
}

interface UserRowProps {
  user: User;
  onOpenDeleteModal: (userId: string, userName: string) => void;
  onToggleHint: (userId: string, currentState: boolean | null) => Promise<void>;
  onToggleSuperAdmin: (userId: string, currentState: boolean | null) => Promise<void>;
  isDeleting: boolean;
}

const UserRow = memo(function UserRow({
  user,
  onOpenDeleteModal,
  onToggleHint,
  onToggleSuperAdmin,
  isDeleting,
}: UserRowProps) {
  return (
    <tr className="hover:bg-surface-2/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.image} name={user.name} size="sm" />
          <span className="font-medium text-text-primary">
            {user.name || "Unbenannt"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-text-muted text-sm">{user.email}</td>
      <td className="px-6 py-4 text-center text-text-secondary">{user.soloCount}</td>
      <td className="px-6 py-4 text-center text-text-secondary">{user.duelCount}</td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onToggleSuperAdmin(user.id, user.isSuperAdmin)}
          className={cn(
            "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
            user.isSuperAdmin
              ? "bg-error/20 text-error hover:bg-error/30"
              : "bg-surface-3 text-text-muted hover:bg-surface-2"
          )}
        >
          {user.isSuperAdmin ? "Admin" : "User"}
        </button>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onToggleHint(user.id, user.hintEnabled)}
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
        {!user.isSuperAdmin ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onOpenDeleteModal(user.id, user.name || "Unbenannt")}
            disabled={isDeleting}
            isLoading={isDeleting}
          >
            Löschen
          </Button>
        ) : (
          <span className="text-text-muted text-sm">-</span>
        )}
      </td>
    </tr>
  );
});

export function UsersTab({ users, onDelete, onToggleHint, onToggleSuperAdmin, deletingId }: UsersTabProps) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    userName: "",
  });

  const handleOpenDeleteModal = (userId: string, userName: string) => {
    setDeleteModal({ isOpen: true, userId, userName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.userId) return;
    await onDelete(deleteModal.userId);
    setDeleteModal({ isOpen: false, userId: null, userName: "" });
  };

  return (
    <>
      <Card variant="surface" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2 border-b border-glass-border">
              <tr>
                <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">User</th>
                <th className="text-left px-6 py-3 text-caption font-medium text-text-secondary">Email</th>
                <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Solo</th>
                <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Duell</th>
                <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Admin</th>
                <th className="text-center px-6 py-3 text-caption font-medium text-text-secondary">Hilfskreis</th>
                <th className="text-right px-6 py-3 text-caption font-medium text-text-secondary">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onOpenDeleteModal={handleOpenDeleteModal}
                  onToggleHint={onToggleHint}
                  onToggleSuperAdmin={onToggleSuperAdmin}
                  isDeleting={deletingId === user.id}
                />
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    Keine User vorhanden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="User löschen"
        message={`User "${deleteModal.userName}" wirklich löschen? Alle Guesses und Gruppenmitgliedschaften werden ebenfalls gelöscht!`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, userId: null, userName: "" })}
      />
    </>
  );
}
