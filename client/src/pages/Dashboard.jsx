import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { dashboardService } from "@/services/dashboardService.js";
import { listingService } from "@/services/listingService.js";
import { enquiryService } from "@/services/enquiryService.js";
import ListingCard from "@/components/listings/ListingCard.jsx";
import Empty from "@/components/common/EmptyState.jsx";
import { imgFallback } from "@/utils/constants.js";
import ListingForm from "@/components/listings/ListingForm.jsx";
function Dashboard() {
  const { user, notify } = useAuth(),
    [items, setItems] = useState([]),
    [received, setReceived] = useState([]),
    [sent, setSent] = useState([]),
    [saved, setSaved] = useState([]),
    [showForm, setShowForm] = useState(false),
    [editing, setEditing] = useState(null);
  useEffect(() => {
    if (!user) {
      return;
    }
    const urls =
      user.role === "owner"
        ? ["/listings/my", "/enquiries/received"]
        : ["/saved", "/enquiries/sent"];
    Promise.all(urls.map((u) => dashboardService.get(u)))
      .then(([a, b]) =>
        user.role === "owner"
          ? (setItems(a.data.data), setReceived(b.data.data))
          : (setSaved(a.data.data), setSent(b.data.data)),
      )
      .catch((e) => notify(e.response?.data?.message || "Could not load dashboard"));
  }, [user, notify]);
  if (!user)
    return (
      <main className="wrap page">
        <Empty
          title="Your dashboard is waiting"
          text="Sign in or create an account to see your homes and messages."
        />
        <Link className="button centered-button" to="/login">
          Log in <ArrowRight size={16} />
        </Link>
      </main>
    );
  async function create(e) {
    try {
      await listingService.create(e);
      notify("Your home is live!");
      setShowForm(false);
      const r = await listingService.mine();
      setItems(r);
    } catch (err) {
      notify(err.response?.data?.message || "Could not create listing");
    }
  }
  async function updateListing(formData) {
    try {
      await listingService.update(editing._id, formData);
      setItems(await listingService.mine());
      setEditing(null);
      notify("Listing updated");
    } catch (err) {
      notify(err.response?.data?.message || "Could not update listing");
    }
  }
  async function remove(id) {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await listingService.remove(id);
      setItems(items.filter((x) => x._id !== id));
      notify("Listing deleted");
    } catch (e) {
      notify(e.response?.data?.message || "Could not delete");
    }
  }
  async function status(id, value) {
    await enquiryService.updateStatus(id, value);
    setReceived(received.map((e) => (e._id === id ? { ...e, status: value } : e)));
    notify("Enquiry updated");
  }
  return (
    <main className="wrap page dashboard">
      <div className="dash-head">
        <div>
          <span className="eyebrow">YOUR LITTLE CORNER</span>
          <h1>
            Hey {user.name.split(" ")[0]}
            <em>, welcome home.</em>
          </h1>
          <p>
            {user.role === "owner"
              ? "Your spaces and the people looking for them."
              : "Your saved places and conversations."}
          </p>
        </div>
        {user.role === "owner" && (
          <button className="button" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> Add a listing
          </button>
        )}
      </div>
      {showForm && <ListingForm onSubmit={create} />}
      {editing && (
        <ListingForm
          key={editing._id}
          initial={editing}
          onSubmit={updateListing}
          onCancel={() => setEditing(null)}
        />
      )}
      {user.role === "owner" ? (
        <>
          <h2 className="dash-section-title">
            Your listings <span>{items.length}</span>
          </h2>
          {items.length ? (
            <div className="dash-list">
              {items.map((x) => (
                <div className="dash-row" key={x._id}>
                  <img src={x.images?.[0]?.url || imgFallback} />
                  <div>
                    <b>{x.title}</b>
                    <small>
                      {x.locality}, {x.city} Â· â‚¹
                      {Number(x.rent).toLocaleString("en-IN")}
                      /mo
                    </small>
                  </div>
                  <span className={x.isAvailable ? "status" : "status off"}>
                    {x.isAvailable ? "Available" : "Unavailable"}
                  </span>
                  <button
                    className="icon-action"
                    aria-label={`Edit listing: ${x.title}`}
                    onClick={() => {
                      setShowForm(false);
                      setEditing(x);
                    }}
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    className="icon-action"
                    onClick={async () => {
                      await listingService.update(x._id, {
                        isAvailable: String(!x.isAvailable),
                      });
                      setItems(
                        items.map((i) =>
                          i._id === x._id ? { ...i, isAvailable: !i.isAvailable } : i,
                        ),
                      );
                    }}
                  >
                    {x.isAvailable ? "Mark unavailable" : "Mark available"}
                  </button>
                  <button
                    className="icon-action danger"
                    aria-label={`Delete listing: ${x.title}`}
                    onClick={() => remove(x._id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Your first listing starts here"
              text="Add your space and help someone feel at home in a new city."
            />
          )}
          <h2 className="dash-section-title">
            Enquiries <span>{received.length}</span>
          </h2>
          {received.length ? (
            <div className="enquiries">
              {received.map((e) => (
                <article key={e._id}>
                  <div>
                    <b>{e.seeker.name}</b>
                    <small>
                      about {e.listing.title} Â· {e.seeker.email} Â· {e.seeker.phone}
                    </small>
                    <p>{e.message}</p>
                  </div>
                  <select
                    value={e.status}
                    onChange={(ev) => status(e._id, ev.target.value)}
                  >
                    <option>new</option>
                    <option>contacted</option>
                    <option>closed</option>
                  </select>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">
              No messages yet. Theyâ€™ll appear here when someone reaches out.
            </p>
          )}
        </>
      ) : (
        <>
          <h2 className="dash-section-title">
            Saved homes <span>{saved.length}</span>
          </h2>
          {saved.length ? (
            <div className="cards">
              {saved.map(
                (s) =>
                  s.listing && (
                    <ListingCard
                      key={s._id}
                      item={s.listing}
                      saved
                      onSavedChange={(isSaved) => {
                        if (!isSaved)
                          setSaved((current) =>
                            current.filter((entry) => entry._id !== s._id),
                          );
                      }}
                    />
                  ),
              )}
            </div>
          ) : (
            <Empty
              title="A blank slate, with possibilities"
              text="Save a place that feels right and itâ€™ll show up here."
            />
          )}
          <h2 className="dash-section-title">
            Your enquiries <span>{sent.length}</span>
          </h2>
          {sent.map((e) => (
            <div className="enquiry-sent" key={e._id}>
              <b>{e.listing?.title}</b>
              <span>{e.status}</span>
              <p>{e.message}</p>
            </div>
          ))}
        </>
      )}
    </main>
  );
}

export default Dashboard;
