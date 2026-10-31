import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
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

function AuthField({ label, name, icon: Icon, ...inputProps }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <Icon size={17} aria-hidden="true" />
        <input name={name} {...inputProps} />
      </span>
    </label>
  );
}

function AuthPage({ register = false }) {
  const { setUser, notify } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;

    const body = Object.fromEntries(new FormData(event.currentTarget));
    setErrorMessage("");
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
      setErrorMessage(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`auth-wrap ${register ? "auth-wrap--register" : "auth-wrap--login"}`}>
      <form className="auth-card" onSubmit={submit} aria-busy={submitting}>
        <div className="auth-mark" aria-hidden="true">
          <Home size={21} strokeWidth={2.2} />
        </div>
        <span className="eyebrow">
          {register ? "FIND YOUR PLACE" : "WELCOME BACK"}
        </span>
        <h1>{register ? "Let’s get you home." : "Good to see you."}</h1>
        <p className="auth-intro">
          {register ? "A better place starts with one step." : "Pick up where you left off."}
        </p>

        {register && (
          <>
            <fieldset className="auth-role-fieldset">
              <legend>I want to</legend>
              <div className="auth-role-options">
                <label className="auth-role-option">
                  <input type="radio" name="role" value="seeker" defaultChecked />
                  <Home size={18} aria-hidden="true" />
                  <span>Find a home</span>
                  <span className="auth-role-check" aria-hidden="true" />
                </label>
                <label className="auth-role-option">
                  <input type="radio" name="role" value="owner" />
                  <KeyRound size={18} aria-hidden="true" />
                  <span>List a property</span>
                  <span className="auth-role-check" aria-hidden="true" />
                </label>
              </div>
            </fieldset>

            <AuthField
              label="Full name"
              name="name"
              icon={UserRound}
              autoComplete="name"
              required
              placeholder="Your name"
            />
            <AuthField
              label="Phone number"
              name="phone"
              icon={Phone}
              type="tel"
              autoComplete="tel"
              required
              placeholder="Your mobile number"
            />
          </>
        )}

        <AuthField
          label="Email address"
          name="email"
          icon={Mail}
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />

        <div className="auth-password-group">
          <label htmlFor="auth-password">Password</label>
          <div className="auth-input-wrap auth-password-field">
            <KeyRound size={17} aria-hidden="true" />
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"}
              minLength={8}
              required
              placeholder={register ? "At least 8 characters" : "Enter your password"}
            />
            <button
              className="auth-password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="button auth-submit" type="submit" disabled={submitting}>
          <span>
            {submitting
              ? register ? "Creating account…" : "Signing in…"
              : register ? "Create account" : "Log in"}
          </span>
          {!submitting && <ArrowRight size={17} />}
          {submitting && <span className="auth-submit-spinner" aria-hidden="true" />}
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
