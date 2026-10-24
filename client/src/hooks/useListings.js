import { useEffect, useState } from "react";
import { listingService } from "@/services/listingService.js";

export function useListings(params) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryKey = JSON.stringify(params);
  useEffect(() => {
    setLoading(true);
    listingService
      .list(JSON.parse(queryKey))
      .then((result) => setListings(result.items))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [queryKey]);
  return { listings, loading };
}
