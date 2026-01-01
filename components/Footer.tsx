"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
] as const;

export function Footer() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    if (segments.length >= 2) {
      segments[1] = newLocale;
    }
    const newPath = segments.join("/");

    startTransition(() => {
      router.push(newPath);
      router.refresh();
    });
    setIsOpen(false);
  };

  return (
    <footer className="border-t border-glass-border bg-surface-1/80 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center justify-between">
        {/* Copyright */}
        <p className="text-sm text-text-muted">
          © {new Date().getFullYear()} PinPoint
        </p>

        {/* Language Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isPending}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-surface-2 border border-glass-border",
              "text-sm text-text-secondary hover:text-text-primary",
              "transition-colors",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.label}</span>
            <svg
              className={cn(
                "w-4 h-4 transition-transform",
                isOpen && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute bottom-full mb-2 right-0 w-48 py-1 bg-surface-2 border border-glass-border rounded-lg shadow-lg">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLocale(lang.code)}
                  disabled={isPending}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm",
                    "transition-colors",
                    locale === lang.code
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
                  )}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {locale === lang.code && (
                    <svg
                      className="w-4 h-4 ml-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
