import { useListings } from "@/hooks/useListings.js";
import ListingCard from "@/components/listings/ListingCard.jsx";
function ListingShelf() {
  const { listings: data } = useListings({ limit: 3 });
  return (
    <div className="cards">
      {data.map((x) => (
        <ListingCard key={x._id} item={x} />
      ))}
      {!data.length && [1, 2, 3].map((n) => <div className="skeleton" key={n} />)}
    </div>
  );
}

export default ListingShelf;
