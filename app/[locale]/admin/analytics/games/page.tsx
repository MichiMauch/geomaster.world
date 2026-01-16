"use client";

import { GamesTab } from "../../components";

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Spiele</h1>
        <p className="text-text-secondary">Alle Spiele und deren Details anzeigen</p>
      </div>

      <GamesTab />
    </div>
  );
}
