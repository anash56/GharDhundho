import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "nav-open" : ""}>
          <Link to="/listings" onClick={() => setOpen(false)}>Find a home</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
              <span className="hello">Hi, {user.name.split(" ")[0]}</span>
              <button className="text-button" type="button" disabled={loggingOut} onClick={requestLogout}>
                <LogOut size={16} /> {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
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
