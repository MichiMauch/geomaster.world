"use client";

import { GroupsTab } from "../../components";
import { useGroupAdmin } from "../../hooks/useGroupAdmin";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function GroupsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { groups, loading, deleteGroup } = useGroupAdmin();

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    setDeletingId(groupId);
    await deleteGroup(groupId, groupName);
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
        <h1 className="text-2xl font-bold text-text-primary">Gruppen</h1>
        <p className="text-text-secondary">Spielgruppen verwalten</p>
      </div>

      <GroupsTab
        groups={groups}
        locale={locale}
        onDelete={handleDeleteGroup}
        deletingId={deletingId}
      />
    </div>
  );
}
