import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { authService } from "@/services/authService.js";
function AuthPage({ register = false }) {
  const { setUser, notify } = useAuth(),
    nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await (register ? authService.register(body) : authService.login(body));
      setUser(r.data.data);
      notify(register ? "Welcome to GharDhundho!" : "You’re back home");
      nav("/dashboard");
    } catch (err) {
      notify(err.response?.data?.message || "Something went wrong");
    }
  }
  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
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
              <input name="name" required placeholder="Full name" />
            </label>
            <label>
              Phone number
              <input name="phone" required placeholder="Mobile number" />
            </label>
            <label>
              I’m here to
              <select name="role">
                <option value="seeker">Find a home</option>
                <option value="owner">List my property</option>
              </select>
            </label>
          </>
        )}
        <label>
          Email address
          <input name="email" type="email" required placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength="8"
            required
            placeholder="At least 8 characters"
          />
        </label>
        <button className="button auth-submit">
          {register ? "Create my account" : "Log in"} <ArrowRight size={17} />
        </button>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New around here?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Log in" : "Create an account"}
          </Link>
        </p>
      </form>
    </main>
  );
}

export default AuthPage;
