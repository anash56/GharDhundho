import { useEffect, useState } from "react";
import { listingService } from "@/services/listingService.js";

export function useListings(params) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const queryKey = JSON.stringify(params ?? {});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    listingService
      .list(JSON.parse(queryKey))
      .then((result) => {
        if (active) {
          setListings(Array.isArray(result?.items) ? result.items : []);
        }
      })
      .catch(() => {
        if (active) {
          setListings([]);
          setError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryKey, retryCount]);

  return {
    listings,
    loading,
    error,
    retry: () => setRetryCount((count) => count + 1),
  };
}
