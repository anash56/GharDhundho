import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { authService } from "@/services/authService.js";

function getSafeDestination(value) {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/login") &&
    !value.startsWith("/register")
  ) {
    return value;
  }
  return "/dashboard";
}

function AuthPage({ register = false }) {
  const { setUser, notify } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;

    const body = Object.fromEntries(new FormData(event.currentTarget));
    setSubmitting(true);

    try {
      const response = await (register
        ? authService.register(body)
        : authService.login(body));
      setUser(response.data.data);
      notify(register ? "Welcome to GharDhundho!" : "You’re back home");
      const destinationState = {};
      if (
        typeof location.state?.returnTo === "string" &&
        location.state.returnTo.startsWith("/listings") &&
        !location.state.returnTo.startsWith("//")
      ) {
        destinationState.from = location.state.returnTo;
      }
      if (typeof location.state?.enquiryDraft === "string") {
        destinationState.enquiryDraft = location.state.enquiryDraft;
      }
      navigate(getSafeDestination(location.state?.from), {
        replace: true,
        state: Object.keys(destinationState).length > 0 ? destinationState : undefined,
      });
    } catch (error) {
      notify(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit} aria-busy={submitting}>
        <span className="eyebrow">
          {register ? "A NEW CITY, A FRESH START" : "GOOD TO HAVE YOU BACK"}
        </span>
        <h1>{register ? "Let’s get you home." : "Welcome back."}</h1>
        <p>
          {register
            ? "Create your account and find your place."
            : "Sign in and pick up where you left off."}
        </p>
        {register && (
          <>
            <label>
              Your name
              <input name="name" autoComplete="name" required placeholder="Full name" />
            </label>
            <label>
              Phone number
              <input name="phone" type="tel" autoComplete="tel" required placeholder="Mobile number" />
            </label>
            <label>
              I’m here to
              <select name="role" defaultValue="seeker" autoComplete="off">
                <option value="seeker">Find a home</option>
                <option value="owner">List my property</option>
              </select>
            </label>
          </>
        )}
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={8}
            required
            placeholder="At least 8 characters"
          />
        </label>
        <button className="button auth-submit" type="submit" disabled={submitting}>
          {submitting
            ? register ? "Creating account…" : "Signing in…"
            : register ? "Create my account" : "Log in"}
          {!submitting && <ArrowRight size={17} />}
        </button>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New around here?"}{" "}
          <Link to={register ? "/login" : "/register"} state={location.state}>
            {register ? "Log in" : "Create an account"}
          </Link>
        </p>
      </form>
    </main>
  );
}

export default AuthPage;
