import { Link } from "react-router-dom";
import { useSettingsFlow } from "../app-hooks/useSettingsFlow";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import { supportFullName, supportInitial, supportRoleLabel } from "../lib/format";

export default function SettingsPage() {
  const {
    user,
    emailEnabled,
    savingEmail,
    onToggleEmail,
    notice,
    clearNotice,
    confirm,
    clearConfirm,
    requestLogout,
  } = useSettingsFlow();

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">Account</p>
        <h1 className="page-title">Settings</h1>
        <p className="lede">
          Email alerts for this desk. Push, theme, and location stay on the Prisma Support app.
        </p>
      </section>

      <nav className="settings-jump" aria-label="Account pages">
        <Link to="/profile">Profile</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/help">Help</Link>
        <Link to="/connection">Connection check</Link>
      </nav>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      {user ? (
        <Link to="/profile" className="address-card history-link">
          <div className="card-heading">
            <span className="avatar" aria-hidden="true">
              {supportInitial(user)}
            </span>
            <div>
              <strong>{supportFullName(user)}</strong>
              <p className="muted">
                {supportRoleLabel(user.role)} · {user.email}
              </p>
            </div>
          </div>
          <span className="muted">View</span>
        </Link>
      ) : null}

      <section className="card" id="preferences">
        <h2>Preferences</h2>
        <div className="pref-list">
          <label className="pref-row">
            <span>
              <strong>Email notifications</strong>
              <p className="muted">Updates and alerts via email</p>
            </span>
            <input
              type="checkbox"
              checked={emailEnabled}
              disabled={savingEmail || !user}
              onChange={(event) => onToggleEmail(event.target.checked)}
            />
          </label>
          <div className="pref-row">
            <span>
              <strong>Language</strong>
              <p className="muted">English. More languages coming soon.</p>
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Account</h2>
        <p>
          <Link to="/help">Help &amp; support</Link>
        </p>
        <p className="muted">Guides for bookings, tickets, payouts, and connection checks.</p>
        <div className="card-actions">
          <button type="button" className="btn btn-secondary" onClick={requestLogout}>
            Log out
          </button>
        </div>
      </section>

      {confirm ? (
        <ConfirmDialog {...confirm} onClose={clearConfirm} />
      ) : null}
    </AppShell>
  );
}
