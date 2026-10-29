import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, MapPin, Search } from "lucide-react";
import Step from "@/components/common/Step.jsx";
import ListingShelf from "@/components/listings/ListingShelf.jsx";
import { imgFallback, popularCities, propertyTypes } from "@/utils/constants.js";
function Home() {
  const [city, setCity] = useState("");
  const [typ, setTyp] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <section className="hero">
        <div className="hero-inner wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> GOOD PLACES, NEW BEGINNINGS
            </div>
            <h1>
              Naye shehar mein
              <br />
              apna ghar <em>dhundho.</em>
            </h1>
            <p>
              Find a room, flat or PG that feels like yours.
              <br className="desktop" /> Direct from owners, made for your next chapter.
            </p>
            <form
              className="search-box"
              onSubmit={(event) => {
                event.preventDefault();
                navigate(
                  `/listings?city=${encodeURIComponent(city)}&propertyType=${typ}`,
                );
              }}
            >
              <div className="search-city">
                <MapPin size={19} aria-hidden="true" />
                <input
                  aria-label="City or locality"
                  placeholder="Which city are you moving to?"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>
              <select aria-label="Property type" value={typ} onChange={(event) => setTyp(event.target.value)}>
                <option value="">Any type</option>
                {propertyTypes.map((type) => (
                  <option value={type} key={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <button className="button" type="submit">
                <Search size={18} aria-hidden="true" /> Find a home
              </button>
            </form>
            <div className="popular">
              Popular:{" "}
              {popularCities.map((c) => (
                <button
                  onClick={() => {
                    setCity(c);
                    navigate(`/listings?city=${c}`);
                  }}
                  key={c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85"
              alt="A bright, welcoming home interior"
              fetchPriority="high"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = imgFallback;
              }}
            />
            <div className="float-card">
              <span className="float-icon">
                <MapPin size={17} />
              </span>
              <span>
                <b>Somewhere you belong</b>
                <small>Your next chapter starts here</small>
              </span>
              <Heart className="float-heart" size={18} />
            </div>
            <span className="hero-stamp">
              YOUR NEXT
              <br />
              CHAPTER ↗
            </span>
          </div>
        </div>
        <div className="hero-bottom wrap">
          <span>MADE FOR THE MOVE</span>
          <div>
            <b>Search</b> by city and home type
          </div>
          <div>
            <b>Compare</b> rent and furnishing
          </div>
          <div>
            <b>Connect</b> directly with owners
          </div>
        </div>
      </section>
      <section className="section wrap">
        <div className="section-top">
          <div>
            <span className="eyebrow">THE GOOD PART</span>
            <h2>
              Make a new city
              <br />
              <em>feel a little closer.</em>
            </h2>
          </div>
          <Link to="/listings" className="link-arrow">
            Explore all homes <ArrowRight size={17} />
          </Link>
        </div>
        <ListingShelf />
      </section>
      <section className="how">
        <div className="wrap">
          <span className="eyebrow">NO MAZE, NO MIDDLEMAN</span>
          <h2>
            Three steps to <em>settling in.</em>
          </h2>
          <div className="steps">
            <Step
              n="01"
              title="Pick your city"
              text="Tell us where life is taking you. Filter by neighbourhood, budget and the space you need."
            />
            <Step
              n="02"
              title="Find your fit"
              text="Browse real places shared by owners. Save your favourites and compare at your pace."
            />
            <Step
              n="03"
              title="Say hello"
              text="Send the owner a message directly. No fees, no fuss, just a conversation."
            />
          </div>
        </div>
      </section>
      <section className="cta wrap">
        <div>
          <span className="eyebrow">GOT A SPACE?</span>
          <h2>
            Someone's looking
            <br />
            for a place <em>like yours.</em>
          </h2>
        </div>
        <Link to="/register" className="button">
          List your place <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}

export default Home;
