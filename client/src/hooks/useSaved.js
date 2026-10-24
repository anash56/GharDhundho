import { savedService } from "@/services/savedService.js";

export function useSaved() {
  return {
    saveListing: (listingId) => savedService.save(listingId),
    removeSavedListing: (listingId) => savedService.remove(listingId),
  };
}
