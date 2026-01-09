"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { nanoid } from "nanoid";

export function useGuestId() {
  const { data: session } = useSession();
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      const stored = localStorage.getItem("guestId");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Reading from localStorage is intentional
        setGuestId(stored);
      } else {
        const newGuestId = nanoid();
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
      }
    }
  }, [session]);

  return guestId;
}
