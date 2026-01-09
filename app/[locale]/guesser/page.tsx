"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { UserSidebar } from "@/components/guesser/UserSidebar";
// Game category configuration
const GAME_CATEGORIES = [
  {
    id: "countries",
    icon: "/images/country.svg",
    image: "/images/countryquiz.webp",
  },
  {
    id: "world",
    icon: "/images/globe.svg",
    image: "/images/worldquiz.webp",
  },
  {
    id: "special",
    icon: "/images/special.svg",
    image: "/images/specialquiz.webp",
    badge: { de: "NEU", en: "NEW", sl: "NOVO" },
  },
  {
    id: "panorama",
    icon: "/images/streetview.svg",
    image: "/images/streetviewquiz.webp",
    badge: { de: "BELIEBT", en: "POPULAR", sl: "PRILJUBLJENO" },
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
  panorama: {
    de: "Street View",
    en: "Street View",
    sl: "Ulični pogled",
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
  panorama: {
    de: "Erkunde die Welt in 360° und finde heraus, wo du bist - wie GeoGuessr!",
    en: "Explore the world in 360° and find out where you are - like GeoGuessr!",
    sl: "Raziskuj svet v 360° in ugotovi, kje si - kot GeoGuessr!",
  },
};

export default function GuesserCategoriesPage() {
  const locale = useLocale();
  const router = useRouter();

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

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <span className="text-4xl">🎯</span>
            {locale === "de" ? "Wähle deine Herausforderung" :
             locale === "en" ? "Choose Your Challenge" :
             "Izberi svoj izziv"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "de" ? "Verschiedene Quiz-Kategorien warten auf dich. Wie gut kennst du die Welt?" :
             locale === "en" ? "Different quiz categories await you. How well do you know the world?" :
             "Različne kategorije kvizov te čakajo. Kako dobro poznaš svet?"}
          </p>
        </div>

        {/* Main Content: Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories (3 cols) */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GAME_CATEGORIES.map((category) => {
                const name = categoryNames[category.id][locale] || categoryNames[category.id].en;
                const description = categoryDescriptions[category.id][locale] || categoryDescriptions[category.id].en;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="group relative overflow-hidden rounded-xl border border-white/10 hover:border-primary transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(0,217,255,0.4)] text-left cursor-pointer min-h-[240px]"
                  >
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center rounded-sm transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url('${category.image}')` }}
                    />

                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 group-hover:from-black/70 group-hover:via-black/40 transition-colors" />

                    {/* Badge */}
                    {category.badge && (
                      <Badge variant="accent" size="md" className="absolute top-3 right-3 z-20">
                        {category.badge[locale as keyof typeof category.badge] || category.badge.en}
                      </Badge>
                    )}

                    {/* Content */}
                    <div className="relative z-10 p-6 flex flex-col h-full">
                      {/* Icon */}
                      <img src={category.icon} alt="" className="w-12 h-12 mb-4 transition-transform group-hover:scale-110" />

                      {/* Text */}
                      <div className="flex-1 flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-2">
                          {name}
                        </h2>
                        <p className="text-sm text-white/80 flex-1">
                          {description}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <div className="mt-4 flex items-center text-sm font-medium text-white/70 group-hover:text-white transition-colors">
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
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: User Stats or Login (1 col) */}
          <div className="lg:col-span-1">
            <UserSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
