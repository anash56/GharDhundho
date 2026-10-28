import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ListingCard from "@/components/listings/ListingCard.jsx";
import { useListings } from "@/hooks/useListings.js";

function ListingShelf() {
  const { listings, loading, error, retry } = useListings({ limit: 3 });

  if (loading) {
    return (
      <div className="cards" aria-label="Loading featured homes" aria-busy="true">
        {[1, 2, 3].map((number) => (
          <div className="skeleton" key={number} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="featured-state" role="alert">
        <h3>Featured homes didn't load</h3>
        <p>Check your connection and try again. You can also browse all available homes.</p>
        <div className="featured-state-actions">
          <button className="button button-small" type="button" onClick={retry}>
            Try again
          </button>
          <Link to="/listings" className="link-arrow">
            Browse all homes <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="featured-state">
        <h3>New homes are on the way</h3>
        <p>There aren't any featured homes to show right now. Browse listings or check back soon.</p>
        <Link to="/listings" className="link-arrow">
          Explore all homes <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="cards">
      {listings.map((listing) => (
        <ListingCard key={listing._id} item={listing} />
      ))}
    </div>
  );
}

export default ListingShelf;
