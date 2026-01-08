"use client";

import { useRef, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { LoginCard } from "@/components/auth/LoginCard";
import { motion, useScroll, useTransform } from "framer-motion";
import type { OverviewStats } from "@/app/api/stats/overview/route";

interface HeroSectionProps {
  locale: string;
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");
  const sectionRef = useRef<HTMLElement>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const handlePlay = () => {
    router.push(`/${locale}/guesser`);
  };

  // If user is authenticated, show simplified hero
  if (status === "authenticated") {
    return (
      <section ref={sectionRef} className="relative min-h-[70vh] overflow-hidden flex items-center">
        {/* Background with world map */}
        <div className="absolute inset-0 -z-10">
          {/* Map background image */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: 'url("/images/hero-map-bg.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Gradient overlays for depth and text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
        </div>

        <motion.div className="container max-w-6xl mx-auto px-4" style={{ y }}>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl mb-6" style={{ letterSpacing: "-1px" }}>
              <span className="text-foreground font-extrabold">GeoMaster</span>
              <span className="font-light" style={{ color: "#FF6B35" }}> World</span>
            </h1>
            <p className="text-xl md:text-2xl text-white mb-4">
              {t("hero.subtitle")}
            </p>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              {t("hero.tagline")}
            </p>

            {/* Stats Bar - Dynamic Quiz Counts */}
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 mb-10">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black" style={{ color: "#00D9FF" }}>
                  {stats?.countryCount ?? "–"}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-white font-medium">{t("hero.countries")}</span>
              </div>
              <span className="hidden sm:block text-2xl text-white/50 font-light">|</span>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black" style={{ color: "#FF6B35" }}>
                  {stats?.worldQuizCount ?? "–"}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-white font-medium">{t("hero.worldQuizzes")}</span>
              </div>
              <span className="hidden sm:block text-2xl text-white/50 font-light">|</span>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black" style={{ color: "#FFD700" }}>
                  {stats?.locationCount ? `${stats.locationCount}+` : "–"}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-white font-medium">{t("hero.locations")}</span>
              </div>
            </div>

            <Button onClick={handlePlay} size="xl" variant="primary" className="rounded-lg">
              {t("hero.ctaPlay")}
            </Button>
          </div>
        </motion.div>
      </section>
    );
  }

  // Unauthenticated: Split-screen layout
  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden flex items-center py-12 md:py-0">
      {/* Background with world map */}
      <div className="absolute inset-0 -z-10">
        {/* Map background image */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/images/hero-map-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Gradient overlays for depth and text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
      </div>

      <motion.div className="container max-w-7xl mx-auto px-4" style={{ y }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {/* Left Side - Game Info (60%) */}
          <div className="lg:col-span-3 text-center lg:text-left">
            {/* Logo/Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6" style={{ letterSpacing: "-1px" }}>
              <span className="text-foreground font-extrabold">GeoMaster</span>
              <span className="font-light" style={{ color: "#FF6B35" }}> World</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white mb-4 max-w-xl mx-auto lg:mx-0">
              {t("hero.subtitle")}
            </p>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-xl mx-auto lg:mx-0">
              {t("hero.tagline")}
            </p>

            {/* Stats Bar - Dynamic Quiz Counts */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 sm:gap-4 md:gap-6 mb-10">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black" style={{ color: "#00D9FF" }}>
                  {stats?.countryCount ?? "–"}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-white font-medium">{t("hero.countries")}</span>
              </div>
              <span className="hidden sm:block text-2xl text-white/50 font-light">|</span>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black" style={{ color: "#FF6B35" }}>
                  {stats?.worldQuizCount ?? "–"}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-white font-medium">{t("hero.worldQuizzes")}</span>
              </div>
              <span className="hidden sm:block text-2xl text-white/50 font-light">|</span>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black" style={{ color: "#FFD700" }}>
                  {stats?.locationCount ? `${stats.locationCount}+` : "–"}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-white font-medium">{t("hero.locations")}</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3 max-w-md mx-auto lg:mx-0">
              <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
                {tAuth("benefits.title")}
              </h3>
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>{tAuth("benefits.ranking")}</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span>{tAuth("benefits.stats")}</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span>{tAuth("benefits.groups")}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card (40%) */}
          <div className="lg:col-span-2">
            <LoginCard />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
