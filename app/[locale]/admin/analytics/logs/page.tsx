"use client";

import { LogsTab } from "../../components";

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">System-Logs</h1>
        <p className="text-text-secondary">Logs, Statistiken und Fehleranalyse</p>
      </div>

      <LogsTab />
    </div>
  );
}
