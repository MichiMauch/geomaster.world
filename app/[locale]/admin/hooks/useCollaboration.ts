import { useState, useEffect, useCallback } from "react";

interface CollabConfig {
  token: string;
  serverUrl: string;
}

interface UseCollaborationReturn {
  config: CollabConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCollaboration(): UseCollaborationReturn {
  const [config, setConfig] = useState<CollabConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/collab/token", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get collaboration token");
      }

      const data = await response.json();
      setConfig({
        token: data.token,
        serverUrl: data.serverUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    refresh: fetchConfig,
  };
}
