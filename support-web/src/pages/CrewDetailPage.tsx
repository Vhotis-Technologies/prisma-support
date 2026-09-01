import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import { useCrewFlow } from "../app-hooks/useCrewFlow";
import { formatCurrency, initials } from "../lib/format";

export default function CrewDetailPage() {
  const { crewId = "" } = useParams<{ crewId: string }>();
  const flow = useCrewFlow(crewId);
  const { member, isLoading, isError, errorMessage, notice, clearNotice, refetch } = flow;

  if (!crewId || (isError && !isLoading && !member)) {
    const is404 = (errorMessage ?? "").toLowerCase().includes("not found");
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/crew">Prisma Crew</Link>
        </p>
        <h1 className="page-title">{is404 ? "Crew member not found" : "Could not load profile"}</h1>
        <p className="lede">{errorMessage}</p>
        <div className="card-actions">
          <button type="button" className="btn btn-ghost" onClick={refetch}>
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  if (isLoading || !member) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/crew">Prisma Crew</Link>
        </p>
        <h1 className="page-title">Crew profile</h1>
        <p className="muted">Loading profile…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/crew">Prisma Crew</Link>
        </p>
        <h1 className="page-title">{member.name}</h1>
        <p className="lede">{member.headline || "Prisma Crew"}</p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="card">
        <div className="card-row">
          <div className="card-heading">
            <span className="avatar">{initials(member.name)}</span>
            <div>
              <p className="muted muted--flush">
                {member.email}
              </p>
            </div>
          </div>
          <div className="chip-row chip-row--flush">
            <span className={member.is_active ? "pill pill-ok" : "pill pill-error"}>
              {member.is_active ? "Active" : "Inactive"}
            </span>
            <span className={member.is_verified ? "pill pill-pending" : "pill pill-muted"}>
              {member.is_verified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>
        <div className="stat-grid">
          <article className="stat-card">
            <p className="stat-label">Bookings</p>
            <p className="stat-value">{member.total_bookings.toLocaleString("en-IE")}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">Rating</p>
            <p className="stat-value">{member.average_rating.toFixed(1)}</p>
            <p className="muted">{member.total_ratings} ratings</p>
          </article>
        </div>
        <div className="card-actions">
          <button type="button" className="btn btn-ghost" onClick={flow.requestToggleActive}>
            {member.is_active ? "Deactivate" : "Reactivate"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={flow.requestToggleVerified}>
            {member.is_verified ? "Unverify" : "Verify"}
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Contact</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${member.email}`}>{member.email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${member.phone.replace(/\s/g, "")}`}>{member.phone}</a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Profile</h2>
        <dl className="meta">
          <div>
            <dt>Joined</dt>
            <dd>{member.date_joined || "—"}</dd>
          </div>
        </dl>
        {member.bio ? (
          <>
            <p className="field-label">Bio</p>
            <p>{member.bio}</p>
          </>
        ) : null}
        {member.specialties.length > 0 ? (
          <>
            <p className="field-label">Specialties</p>
            <ul className="benefit-list">
              {member.specialties.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        {member.service_areas.length > 0 ? (
          <>
            <p className="field-label">Service areas</p>
            <ul className="benefit-list">
              {member.service_areas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        {member.vehicle_types.length > 0 ? (
          <>
            <p className="field-label">Vehicle types</p>
            <ul className="benefit-list">
              {member.vehicle_types.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="card">
        <h2>Performance</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Lifetime earnings</dt>
            <dd>{formatCurrency(member.lifetime_earnings)}</dd>
          </div>
          <div>
            <dt>Total bookings</dt>
            <dd>{member.total_bookings.toLocaleString("en-IE")}</dd>
          </div>
          <div>
            <dt>Average rating</dt>
            <dd>{member.average_rating.toFixed(1)} / 5</dd>
          </div>
          <div>
            <dt>Total ratings</dt>
            <dd>{member.total_ratings.toLocaleString("en-IE")}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Comments & notes</h2>
        {member.comments.length === 0 ? (
          <p className="muted">No comments yet.</p>
        ) : (
          <ul className="booking-list">
            {member.comments.map((comment) => (
              <li key={comment.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{comment.author_label}</strong>
                  <span className={comment.source === "customer" ? "pill pill-ok" : "pill pill-pending"}>
                    {comment.source === "customer" ? "Customer" : "Support"}
                  </span>
                </div>
                {typeof comment.rating === "number" ? (
                  <p>{comment.rating.toFixed(1)} / 5</p>
                ) : null}
                <p>{comment.text}</p>
                <p className="muted">{comment.created_at}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
