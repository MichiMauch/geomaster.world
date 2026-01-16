"use client";

import { UsersTab } from "../components";
import { useUserAdmin } from "../hooks/useUserAdmin";
import { useState } from "react";

export default function UsersPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    users,
    loading,
    deleteUser,
    toggleHint,
    toggleSuperAdmin,
  } = useUserAdmin();

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    setDeletingId(userId);
    await deleteUser(userId, userName);
    setDeletingId(null);
  };

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
        <h1 className="text-2xl font-bold text-text-primary">Benutzer</h1>
        <p className="text-text-secondary">Registrierte Benutzer verwalten</p>
      </div>

      <UsersTab
        users={users}
        onDelete={handleDeleteUser}
        onToggleHint={toggleHint}
        onToggleSuperAdmin={toggleSuperAdmin}
        deletingId={deletingId}
      />
    </div>
  );
}
