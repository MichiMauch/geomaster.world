"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminData } from "./hooks/useAdminData";
import { GroupsTab, UsersTab, CountriesTab, LocationsTab, ImageLocationsTab } from "./components";
import type { AdminTab } from "./types";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [activeTab, setActiveTab] = useState<AdminTab>("groups");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSuperAdmin = session?.user?.email === "michi.mauch@netnode.ch";

  const {
    groups,
    users,
    countries,
    locations,
    imageLocations,
    loading,
    deleteGroup,
    deleteUser,
    toggleHint,
    toggleSuperAdmin,
    addCountry,
    deleteCountry,
    updateCountry,
    addLocation,
    deleteLocation,
    importLocations,
    fetchLocationsByCountry,
    fetchImageLocations,
    addImageLocation,
    deleteImageLocation,
    translateLocations,
    fetchTranslationStatus,
  } = useAdminData();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isSuperAdmin) {
      router.push(`/${locale}`);
    }
  }, [session, status, isSuperAdmin, router, locale]);

  // Wrapper functions to handle deletingId state
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    setDeletingId(groupId);
    await deleteGroup(groupId, groupName);
    setDeletingId(null);
  };

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    setDeletingId(userId);
    await deleteUser(userId, userName);
    setDeletingId(null);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-surface-2 border border-glass-border w-fit">
          <TabButton
            active={activeTab === "groups"}
            onClick={() => setActiveTab("groups")}
            label={`Gruppen (${groups.length})`}
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            label={`User (${users.length})`}
          />
          <TabButton
            active={activeTab === "countries"}
            onClick={() => setActiveTab("countries")}
            label={`Länder (${countries.length})`}
          />
          <TabButton
            active={activeTab === "locations"}
            onClick={() => setActiveTab("locations")}
            label="Orte"
          />
          <TabButton
            active={activeTab === "image-locations"}
            onClick={() => setActiveTab("image-locations")}
            label={`Bild-Orte (${imageLocations.length})`}
          />
        </div>

        {/* Content */}
        {activeTab === "groups" && (
          <GroupsTab
            groups={groups}
            locale={locale}
            onDelete={handleDeleteGroup}
            deletingId={deletingId}
          />
        )}

        {activeTab === "users" && (
          <UsersTab
            users={users}
            onDelete={handleDeleteUser}
            onToggleHint={toggleHint}
            onToggleSuperAdmin={toggleSuperAdmin}
            deletingId={deletingId}
          />
        )}

        {activeTab === "countries" && (
          <CountriesTab
            countries={countries}
            onAdd={addCountry}
            onDelete={deleteCountry}
            onUpdate={updateCountry}
          />
        )}

        {activeTab === "locations" && (
          <LocationsTab
            locations={locations}
            countries={countries}
            onDelete={deleteLocation}
            onAdd={addLocation}
            onImport={importLocations}
            onFetchByCountry={fetchLocationsByCountry}
            onTranslate={translateLocations}
            onFetchTranslationStatus={fetchTranslationStatus}
          />
        )}

        {activeTab === "image-locations" && (
          <ImageLocationsTab
            imageLocations={imageLocations}
            onFetch={fetchImageLocations}
            onAdd={addImageLocation}
            onDelete={deleteImageLocation}
          />
        )}
      </main>
    </div>
  );
}

// Tab button component
function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-all duration-200",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
      )}
    >
      {label}
    </button>
  );
}
