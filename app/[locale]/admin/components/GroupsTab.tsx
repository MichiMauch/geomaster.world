"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Group } from "../types";

interface GroupsTabProps {
  groups: Group[];
  locale: string;
  onDelete: (groupId: string, groupName: string) => Promise<void>;
  deletingId: string | null;
}

export function GroupsTab({ groups, locale, onDelete, deletingId }: GroupsTabProps) {
  return (
    <Card variant="surface" padding="none" className="overflow-hidden">
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
                    onClick={() => onDelete(group.id, group.name)}
                    disabled={deletingId === group.id}
                    isLoading={deletingId === group.id}
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
    </Card>
  );
}
