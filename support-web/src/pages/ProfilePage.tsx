import { Link } from "react-router-dom";
import { useProfileFlow } from "../app-hooks/useProfileFlow";
import AppShell from "../components/AppShell";
import StatusBanner from "../components/StatusBanner";
import {
  formatSupportDob,
  formatSupportGender,
  supportFullName,
  supportInitial,
  supportRoleLabel,
} from "../lib/format";

export default function ProfilePage() {
  const { profile, notice, clearNotice, refreshing, onRefresh } = useProfileFlow();

  if (!profile) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/settings">Settings</Link>
        </p>
        <h1 className="page-title">Profile</h1>
        <p className="muted">Loading profile…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">
            <Link to="/settings">Settings</Link>
          </p>
          <h1 className="page-title">{supportFullName(profile)}</h1>
          <p className="lede">
            Staff details from this account. Name and email are not editable on the web.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={refreshing}
          onClick={onRefresh}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="card" id="profile">
        <div className="card-row">
          <div className="card-heading">
            <span className="avatar" aria-hidden="true">
              {supportInitial(profile)}
            </span>
            <div>
              <p className="muted muted--flush">{profile.email}</p>
            </div>
          </div>
          <span className="pill pill-pending">{supportRoleLabel(profile.role)}</span>
        </div>
        <dl className="meta meta-2">
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{supportRoleLabel(profile.role)}</dd>
          </div>
          <div>
            <dt>Gender</dt>
            <dd>{formatSupportGender(profile.gender)}</dd>
          </div>
          <div>
            <dt>Date of birth</dt>
            <dd>{formatSupportDob(profile.dob)}</dd>
          </div>
        </dl>
      </section>

      <Link to="/tickets" className="address-card history-link">
        <div>
          <strong>Track tickets</strong>
          <p className="muted">Open the support ticket queue.</p>
        </div>
      </Link>
    </AppShell>
  );
}
