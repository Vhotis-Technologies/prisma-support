import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginErrorMessage } from "../auth/errors";
import { useAuth } from "../auth/context";
import BrandMark from "../components/BrandMark";
import StatusBanner from "../components/StatusBanner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== "/login"
      ? (location.state as { from: string }).from
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-panel">
        <BrandMark inverted />
        <div className="auth-panel-copy">
          <p className="auth-kicker">Support portal</p>
          <h1>The same desk as the Prisma Support app.</h1>
          <p>
            Sign in with your support account to manage bookings, customers, tickets, and payouts
            from the web.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="lede">Sign in to continue to the support dashboard.</p>

          <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
            <StatusBanner notice={error ? { type: "error", message: error } : null} />

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </label>

            <label className="field">
              <div className="field-label-row">
                <span>Password</span>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <div className="field-password">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
