"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { CountryForm, CountryTable, CountryEditModal } from "./countries";
import type { Country } from "../types";

interface CountriesTabProps {
  countries: Country[];
  onAdd: (country: Omit<Country, "createdAt" | "locationCount"> & { geoJsonData?: string }) => Promise<boolean>;
  onDelete: (countryId: string) => Promise<void>;
  onUpdate: (countryId: string, data: Partial<Country> & { geoJsonData?: string }) => Promise<boolean>;
}

export function CountriesTab({ countries, onAdd, onDelete, onUpdate }: CountriesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editCountry, setEditCountry] = useState<Country | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    countryId: string | null;
    countryName: string;
  }>({
    isOpen: false,
    countryId: null,
    countryName: "",
  });

  const handleEdit = useCallback((country: Country) => {
    setEditCountry(country);
  }, []);

  const handleDelete = useCallback((countryId: string, countryName: string) => {
    setDeleteModal({ isOpen: true, countryId, countryName });
  }, []);

  const handleToggleActive = useCallback(async (country: Country) => {
    await onUpdate(country.id, { isActive: !country.isActive });
  }, [onUpdate]);

  const handleDeleteConfirm = async () => {
    if (!deleteModal.countryId) return;
    await onDelete(deleteModal.countryId);
    setDeleteModal({ isOpen: false, countryId: null, countryName: "" });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">Länder verwalten</h2>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Neues Land hinzufügen
            </Button>
          )}
        </div>

        {/* Add country form */}
        {showForm && (
          <CountryForm
            onAdd={onAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Country table */}
        <CountryTable
          countries={countries}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Edit Modal */}
      {editCountry && (
        <CountryEditModal
          country={editCountry}
          onSave={onUpdate}
          onClose={() => setEditCountry(null)}
        />
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Land löschen"
        message={`Möchtest du "${deleteModal.countryName}" wirklich löschen? Alle zugehörigen Orte bleiben erhalten.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, countryId: null, countryName: "" })}
      />
    </>
  );
}
