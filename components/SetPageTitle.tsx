"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";

interface SetPageTitleProps {
  title: string;
}

export function SetPageTitle({ title }: SetPageTitleProps) {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [title, setPageTitle]);

  return null;
}
