"use client";

import { useState, useRef, useCallback } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface EmojiOption {
  emoji: string;
  label: string;
}

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  options: EmojiOption[];
  label?: string;
  placeholder?: string;
  columns?: number;
}

export function EmojiPicker({
  value,
  onChange,
  options,
  label,
  placeholder = "Auswählen",
  columns = 6,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, closeDropdown);

  const selectedOption = options.find((o) => o.emoji === value);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-body-small font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-glass-border text-left flex items-center justify-between hover:bg-surface-3 transition-colors"
      >
        <span className="text-2xl">{value || options[0]?.emoji || "❓"}</span>
        <span className="text-text-muted text-sm">
          {selectedOption?.label || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-surface-2 border border-glass-border rounded-lg shadow-lg p-3 max-h-64 overflow-y-auto">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {options.map((option) => (
              <button
                key={option.emoji}
                type="button"
                onClick={() => {
                  onChange(option.emoji);
                  setIsOpen(false);
                }}
                className={`p-2 text-2xl rounded-lg transition-colors hover:bg-surface-3 ${
                  value === option.emoji ? "bg-primary/20 ring-2 ring-primary" : ""
                }`}
                title={option.label}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
