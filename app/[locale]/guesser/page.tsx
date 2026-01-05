"use client";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LoginCard } from "@/components/auth/LoginCard";
import { Globe, Flag, MapPin, Sparkles } from "lucide-react";

// Game category configuration
const GAME_CATEGORIES = [
  {
    id: "countries",
    icon: Flag,
    emoji: "🌍",
    gradient: "from-emerald-500/20 to-teal-500/20",
    hoverGradient: "hover:from-emerald-500/30 hover:to-teal-500/30",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-500",
  },
  {
    id: "world",
    icon: Globe,
    emoji: "🌐",
    gradient: "from-blue-500/20 to-indigo-500/20",
    hoverGradient: "hover:from-blue-500/30 hover:to-indigo-500/30",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-500",
  },
  {
    id: "special",
    icon: Sparkles,
    emoji: "✨",
    gradient: "from-purple-500/20 to-pink-500/20",
    hoverGradient: "hover:from-purple-500/30 hover:to-pink-500/30",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-500",
  },
];

// Translations for categories
const categoryNames: Record<string, Record<string, string>> = {
  countries: {
    de: "Länderquiz",
    en: "Country Quiz",
    sl: "Kviz držav",
  },
  world: {
    de: "Welt-Quiz",
    en: "World Quiz",
    sl: "Svetovni kviz",
  },
  special: {
    de: "Spezialquizes",
    en: "Special Quizzes",
    sl: "Posebni kvizi",
  },
};

const categoryDescriptions: Record<string, Record<string, string>> = {
  countries: {
    de: "Teste dein Wissen über verschiedene Länder und ihre Geografie",
    en: "Test your knowledge about different countries and their geography",
    sl: "Preizkusi svoje znanje o različnih državah in njihovi geografiji",
  },
  world: {
    de: "Entdecke berühmte Orte, Rennstrecken und mehr auf der ganzen Welt",
    en: "Discover famous places, race tracks and more around the world",
    sl: "Odkrij znamenite kraje, dirkališča in več po vsem svetu",
  },
  special: {
    de: "Flaggen, Ländernamen, geografische Mittelpunkte und mehr",
    en: "Flags, country names, geographic centers and more",
    sl: "Zastave, imena držav, geografski centri in več",
  },
};

export default function GuesserCategoriesPage() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("guesser");

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/${locale}/guesser/${categoryId}`);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background with world map */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {locale === "de" ? "Wähle deine Herausforderung" :
             locale === "en" ? "Choose Your Challenge" :
             "Izberi svoj izziv"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {locale === "de" ? "Verschiedene Quiz-Kategorien warten auf dich. Wie gut kennst du die Welt?" :
             locale === "en" ? "Different quiz categories await you. How well do you know the world?" :
             "Različne kategorije kvizov te čakajo. Kako dobro poznaš svet?"}
          </p>
        </div>

        {/* Main Content: Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories (3 cols) */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {GAME_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const name = categoryNames[category.id][locale] || categoryNames[category.id].en;
                const description = categoryDescriptions[category.id][locale] || categoryDescriptions[category.id].en;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`
                      group relative overflow-hidden rounded-xl p-6
                      bg-gradient-to-br ${category.gradient} ${category.hoverGradient}
                      border ${category.borderColor}
                      transition-all duration-300 ease-out
                      hover:scale-[1.02] hover:shadow-xl
                      text-left cursor-pointer
                      min-h-[240px] flex flex-col
                    `}
                  >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 text-8xl opacity-10 transform rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110">
                      {category.emoji}
                    </div>

                    {/* Icon */}
                    <div className={`
                      w-14 h-14 rounded-xl mb-4
                      bg-surface-1/80 backdrop-blur-sm
                      flex items-center justify-center
                      ${category.iconColor}
                      transition-transform group-hover:scale-110
                    `}>
                      <IconComponent className="w-7 h-7" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <h2 className="text-xl font-bold text-foreground mb-2">
                        {name}
                      </h2>
                      <p className="text-sm text-muted-foreground flex-1">
                        {description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="mt-4 flex items-center text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                      <span>
                        {locale === "de" ? "Spiele entdecken" :
                         locale === "en" ? "Explore games" :
                         "Odkrij igre"}
                      </span>
                      <svg
                        className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: User Stats or Login (1 col) */}
          <div className="lg:col-span-1">
            {status === "authenticated" && session?.user ? (
              <Card className="p-4 h-full">
                <div className="flex items-center gap-3 mb-4">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {(session.user.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "de" ? "Eingeloggt" : locale === "en" ? "Logged in" : "Prijavljen"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === "de" ? "Wähle eine Kategorie und starte dein nächstes Spiel!" :
                   locale === "en" ? "Choose a category and start your next game!" :
                   "Izberi kategorijo in začni naslednjo igro!"}
                </p>
              </Card>
            ) : (
              <LoginCard />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
