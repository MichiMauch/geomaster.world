"use client";

import { useState, useEffect } from "react";
import { X, Check, Mail, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ShareResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  gameType: string;
  gameTypeName: string;
  score: number;
  customUrl?: string;  // For Duel Challenge URLs
}

const labels = {
  de: {
    title: "Ergebnis teilen",
    x: "X",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    email: "E-Mail",
    copyLink: "Link kopieren",
    linkCopied: "Kopiert!",
    close: "Schliessen",
    shareText: (score: number, gameName: string) =>
      `Ich habe ${score} Punkte bei GeoMaster im Spiel "${gameName}" erreicht! Kannst du mich schlagen?`,
    emailSubject: (gameName: string) =>
      `Mein GeoMaster Ergebnis in "${gameName}"`,
  },
  en: {
    title: "Share Result",
    x: "X",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    email: "E-Mail",
    copyLink: "Copy Link",
    linkCopied: "Copied!",
    close: "Close",
    shareText: (score: number, gameName: string) =>
      `I scored ${score} points in "${gameName}" on GeoMaster! Can you beat me?`,
    emailSubject: (gameName: string) =>
      `My GeoMaster Result in "${gameName}"`,
  },
  sl: {
    title: "Deli rezultat",
    x: "X",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    email: "E-pošta",
    copyLink: "Kopiraj povezavo",
    linkCopied: "Kopirano!",
    close: "Zapri",
    shareText: (score: number, gameName: string) =>
      `V igri GeoMaster sem dosegel ${score} točk v "${gameName}"! Me lahko premagas?`,
    emailSubject: (gameName: string) =>
      `Moj GeoMaster rezultat v "${gameName}"`,
  },
};

// X (Twitter) Icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Facebook Icon
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// WhatsApp Icon
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ShareResultModal({
  isOpen,
  onClose,
  locale,
  gameType,
  gameTypeName,
  score,
  customUrl,
}: ShareResultModalProps) {
  const [copied, setCopied] = useState(false);

  const t = labels[locale as keyof typeof labels] || labels.de;

  // Build share URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = customUrl || `${baseUrl}/${locale}/guesser/${gameType}`;
  const shareText = t.shareText(score, gameTypeName);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = `${shareText} ${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const subject = t.emailSubject(gameTypeName);
    const body = `${shareText}\n\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!isOpen) return null;

  const shareButtons = [
    {
      name: t.x,
      icon: <XIcon className="w-7 h-7" />,
      color: "bg-black",
      onClick: handleX,
    },
    {
      name: t.facebook,
      icon: <FacebookIcon className="w-7 h-7" />,
      color: "bg-[#1877F2]",
      onClick: handleFacebook,
    },
    {
      name: t.whatsapp,
      icon: <WhatsAppIcon className="w-7 h-7" />,
      color: "bg-[#25D366]",
      onClick: handleWhatsApp,
    },
    {
      name: t.email,
      icon: <Mail className="w-7 h-7" />,
      color: "bg-[#EA4335]",
      onClick: handleEmail,
    },
    {
      name: copied ? t.linkCopied : t.copyLink,
      icon: copied ? <Check className="w-7 h-7" /> : <Link2 className="w-7 h-7" />,
      color: copied ? "bg-success" : "bg-[#FF6B8A]",
      onClick: handleCopyLink,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-white/10 animate-fade-in"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("/images/share-modal-bg.webp")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Buttons Grid */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {shareButtons.map((button) => (
              <button
                key={button.name}
                onClick={button.onClick}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-16 h-16 rounded-full ${button.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}
                >
                  {button.icon}
                </div>
                <span className="text-xs text-text-secondary font-medium">
                  {button.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-border">
          <Button
            onClick={onClose}
            variant="ghost"
            size="md"
            className="w-full text-text-muted"
          >
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
