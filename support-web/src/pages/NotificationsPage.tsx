import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">Account</p>
        <h1 className="page-title">Notifications</h1>
        <p className="lede">
          The support app seeds a local inbox. There is no notification list endpoint, so this page
          does not invent one.
        </p>
      </section>

      <div id="notifications">
        <EmptyState
          message="No inbox on the web yet. Bookings, tickets, and vouchers stay in their own queues. Email alerts are controlled in Settings."
          actionLabel="Email preferences"
          onAction={() => navigate("/settings")}
        />
      </div>
    </AppShell>
  );
}
