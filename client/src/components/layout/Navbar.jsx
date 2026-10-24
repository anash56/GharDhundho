import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Home as HomeIcon, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { authService } from "@/services/authService.js";
function Header() {
  const { user, setUser, notify } = useAuth(),
    [open, setOpen] = useState(false);
  const nav = useNavigate();
  async function logout() {
    await authService.logout();
    setUser(null);
    notify("You are signed out");
    nav("/");
  }
  return (
    <header className="header">
      <div className="nav wrap">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <HomeIcon size={19} />
          </span>
          ghar<span>dhundho</span>
        </Link>
        <button
          className="mobile-menu"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "nav-open" : ""}>
          <Link to="/listings">Find a home</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <span className="hello">Hi, {user.name.split(" ")[0]}</span>
              <button className="text-button" onClick={logout}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link className="button button-small" to="/register">
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
