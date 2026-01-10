"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function PanoramaRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    router.replace(`/${locale}/guesser/panorama:world`);
  }, [locale, router]);

  return null;
}
