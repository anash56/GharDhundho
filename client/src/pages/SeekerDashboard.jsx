import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { dashboardService } from "@/services/dashboardService.js";
import ListingCard from "@/components/listings/ListingCard.jsx";
import Empty from "@/components/common/EmptyState.jsx";
import {
  DashboardHeader,
  DashboardSectionTitle,
} from "@/pages/Dashboard.jsx";

export default function SeekerDashboard() {
  const { user, notify } = useAuth();
  const [saved, setSaved] = useState([]);
  const [sent, setSent] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      dashboardService.get("/saved"),
      dashboardService.get("/enquiries/sent"),
    ])
      .then(([savedResponse, sentResponse]) => {
        if (!active) return;
        setSaved(savedResponse.data.data || []);
        setSent(sentResponse.data.data || []);
      })
      .catch((error) => {
        if (active) {
          notify(error.response?.data?.message || "Could not load your dashboard. Please retry.");
        }
      });
    return () => {
      active = false;
    };
  }, [notify]);

  return (
    <main className="wrap page dashboard">
      <DashboardHeader
        user={user}
        description="Your saved places and conversations."
      />
      <DashboardSectionTitle count={saved.length}>Saved homes</DashboardSectionTitle>
      {saved.length ? (
        <div className="cards">
          {saved.map((entry) => entry.listing && (
            <ListingCard
              key={entry._id}
              item={entry.listing}
              saved
              onSavedChange={(isSaved) => {
                if (!isSaved) {
                  setSaved((current) => current.filter((savedEntry) => savedEntry._id !== entry._id));
                }
              }}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="A blank slate, with possibilities"
          text="Save a place that feels right and it’ll show up here."
        />
      )}

      <DashboardSectionTitle count={sent.length}>Your enquiries</DashboardSectionTitle>
      {sent.length ? sent.map((enquiry) => (
        <div className="enquiry-sent" key={enquiry._id}>
          <b>{enquiry.listing?.title || "Listing no longer available"}</b>
          <span>{enquiry.status}</span>
          <p>{enquiry.message}</p>
        </div>
      )) : (
        <Empty
          title="No enquiries yet"
          text="Send a message to an owner when a place catches your eye."
        />
      )}
    </main>
  );
}
