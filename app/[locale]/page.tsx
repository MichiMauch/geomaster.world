import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HeroSection from "@/components/landing/HeroSection";
import NewsSection from "@/components/landing/NewsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LeaderboardTeaserSection from "@/components/landing/LeaderboardTeaserSection";
import PersonalStatsSection from "@/components/landing/PersonalStatsSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.seo" });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://geomaster.world";
  const url = `${baseUrl}/${locale}`;

  return {
    title: {
      absolute: t("title"),
    },
    description: t("description"),
    alternates: {
      canonical: url,
      languages: {
        de: `${baseUrl}/de`,
        en: `${baseUrl}/en`,
        sl: `${baseUrl}/sl`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: url,
      siteName: "GeoMaster World",
      images: [
        {
          url: `${baseUrl}/images/worldquiz.webp`,
          width: 1200,
          height: 630,
          alt: "GeoMaster World",
        },
      ],
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${baseUrl}/images/worldquiz.webp`],
    },
    other: {
      "geo.region": "CH-ZH",
      "geo.placename": "Zurich",
      "geo.position": "47.3769;8.5417",
      "ICBM": "47.3769, 8.5417",
    },
  };
}

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.seo" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GeoMaster World",
    "operatingSystem": "Web",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "description": t("description"),
    "genre": "Geography Quiz",
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <HeroSection locale={locale} />

      {/* News Section */}
      <NewsSection locale={locale} />

      {/* How It Works */}
      <HowItWorksSection locale={locale} />

      {/* Leaderboard Teaser */}
      <LeaderboardTeaserSection locale={locale} />

      {/* Personal Stats (only for logged-in users) */}
      <PersonalStatsSection locale={locale} />
    </div>
  );
}
