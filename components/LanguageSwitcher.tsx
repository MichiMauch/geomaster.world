'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'sl', label: 'SL' }
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    // Replace the locale in the pathname
    // Pathname is like /de/groups/123 or /en/play/abc
    const segments = pathname.split('/');
    // First segment is empty, second is the locale
    if (segments.length >= 2) {
      segments[1] = newLocale;
    }
    const newPath = segments.join('/');

    startTransition(() => {
      router.push(newPath);
      router.refresh();
    });
  };

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-glass-border">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => switchLocale(lang.code)}
          disabled={isPending}
          className={cn(
            'px-2.5 py-1 rounded-md text-sm font-medium transition-all duration-200',
            locale === lang.code
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-3',
            isPending && 'opacity-50 cursor-not-allowed'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
