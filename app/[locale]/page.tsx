"use client";

import { useParams } from "next/navigation";
import HeroSection from "@/components/landing/HeroSection";
import NewsSection from "@/components/landing/NewsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LeaderboardTeaserSection from "@/components/landing/LeaderboardTeaserSection";
import PersonalStatsSection from "@/components/landing/PersonalStatsSection";

export default function LandingPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen">
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
