"use client";

import { ImageLocationsTab } from "../../components";
import { useLocationAdmin } from "../../hooks/useLocationAdmin";

export default function ImagesPage() {
  const {
    imageLocations,
    loading,
    fetchImageLocations,
    addImageLocation,
    deleteImageLocation,
  } = useLocationAdmin();

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
        <h1 className="text-2xl font-bold text-text-primary">Bild-Maps</h1>
        <p className="text-text-secondary">Orte auf Bild-Maps verwalten</p>
      </div>

      <ImageLocationsTab
        imageLocations={imageLocations}
        onFetch={fetchImageLocations}
        onAdd={addImageLocation}
        onDelete={deleteImageLocation}
      />
    </div>
  );
}
