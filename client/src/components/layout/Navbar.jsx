import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Home as HomeIcon, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { authService } from "@/services/authService.js";

function Header() {
  const { user, setUser, notify } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const nav = useNavigate();

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authService.logout();
      setUser(null);
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
              <button className="text-button" type="button" disabled={loggingOut} onClick={logout}>
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
    </header>
  );
}

export default Header;
