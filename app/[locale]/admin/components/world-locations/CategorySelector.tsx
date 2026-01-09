"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { WorldQuizType } from "../../types";

interface CategorySelectorProps {
  categories: WorldQuizType[];
  selectedCategory: WorldQuizType | null;
  onSelect: (category: WorldQuizType) => void;
}

const CategoryButton = memo(function CategoryButton({
  category,
  isSelected,
  onSelect,
}: {
  category: WorldQuizType;
  isSelected: boolean;
  onSelect: (category: WorldQuizType) => void;
}) {
  return (
    <button
      onClick={() => onSelect(category)}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
        isSelected
          ? "bg-primary text-white"
          : "bg-surface-2 text-text-secondary hover:bg-surface-3"
      )}
    >
      <span>{category.icon}</span>
      <span>{category.name}</span>
      <Badge variant="default" className="ml-1">{category.locationCount}</Badge>
    </button>
  );
});

export function CategorySelector({ categories, selectedCategory, onSelect }: CategorySelectorProps) {
  return (
    <Card variant="surface" padding="md">
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-body-small font-medium text-text-secondary">Kategorie:</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              isSelected={selectedCategory?.id === category.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
