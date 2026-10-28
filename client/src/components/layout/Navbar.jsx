import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Home as HomeIcon, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { authService } from "@/services/authService.js";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import { hasUnsavedChanges } from "@/utils/unsavedChanges.js";

function Header() {
  const { user, setUser, notify } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showUnsavedLogoutConfirmation, setShowUnsavedLogoutConfirmation] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const menuToggleRef = useRef(null);

  // Keep the mobile menu from staying open after navigation.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // Escape closes the mobile navigation and restores focus to its toggle.
  useEffect(() => {
    if (!open) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        menuToggleRef.current?.focus();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function requestLogout() {
    if (hasUnsavedChanges()) {
      setShowUnsavedLogoutConfirmation(true);
      return;
    }
    setShowLogoutConfirmation(true);
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authService.logout();
      setUser(null);
      setShowLogoutConfirmation(false);
      setOpen(false);
      notify("You are signed out");
      nav("/");
    } catch (error) {
      notify(error.response?.data?.message || "Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="header">
      <div className="nav wrap">
        <Link to="/" className="brand">
          <span className="brand-icon"><HomeIcon size={19} /></span>
          ghar<span>dhundho</span>
        </Link>
        <button
          className="mobile-menu"
          ref={menuToggleRef}
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="primary-navigation"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav id="primary-navigation" className={open ? "nav-open" : ""} aria-label="Main navigation">
          <NavLink
            to="/listings"
            className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}
            onClick={() => setOpen(false)}
          >
            Find a home
          </NavLink>
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                Dashboard
              </NavLink>
              <span className="hello">Hi, {user.name.split(" ")[0]}</span>
              <button className="text-button" type="button" disabled={loggingOut} onClick={requestLogout}>
                <LogOut size={16} /> {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                Log in
              </NavLink>
              <Link className="button button-small" to="/register" onClick={() => setOpen(false)}>
                Get started <ArrowRight size={15} />
              </Link>
            </>
          )}
        </nav>
      </div>
      <ConfirmDialog
        open={showUnsavedLogoutConfirmation}
        title="Discard listing changes?"
        description="You have unsaved listing changes. Signing out will discard them. Continue to sign out?"
        confirmLabel="Continue to sign out"
        cancelLabel="Stay signed in"
        onCancel={() => setShowUnsavedLogoutConfirmation(false)}
        onConfirm={() => {
          setShowUnsavedLogoutConfirmation(false);
          setShowLogoutConfirmation(true);
        }}
      />
      <ConfirmDialog
        open={showLogoutConfirmation}
        title="Sign out?"
        description="Are you sure you want to sign out of GharDhundho? You will need to sign in again to manage your listings and enquiries."
        confirmLabel="Sign out"
        busyLabel="Signing outâ€¦"
        busy={loggingOut}
        icon={LogOut}
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={logout}
      />
    </header>
  );
}

export default Header;
