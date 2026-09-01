import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function HelpPage() {
  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">Account</p>
        <h1 className="page-title">Help</h1>
        <p className="lede">
          This is the same desk as the Prisma Support app. Use the sidebar for day-to-day work.
        </p>
      </section>

      <nav className="settings-jump" aria-label="Related">
        <Link to="/settings">Settings</Link>
        <Link to="/connection">Connection check</Link>
      </nav>

      <section className="card">
        <h2>Bookings</h2>
        <p>
          Open <Link to="/bookings">Bookings</Link> for appointments and bulk orders. From a detail
          page you can reschedule, cancel, or reassign crew — the same actions as the app.
        </p>
      </section>

      <section className="card">
        <h2>Customers</h2>
        <p>
          <Link to="/customers">Customers</Link> covers B2C accounts, fleets and branches, partners,
          and vehicles. Subscription terminate/renew and vehicle transfer live on those detail pages.
        </p>
      </section>

      <section className="card">
        <h2>Tickets</h2>
        <p>
          <Link to="/tickets">Tickets</Link> is the support queue. Open a ticket to add a resolution
          note and mark it completed; the customer is emailed when you resolve it.
        </p>
      </section>

      <section className="card">
        <h2>Payouts and accounting</h2>
        <p>
          <Link to="/payouts">Payouts</Link> lists partner balances and crew unpaid / pending / paid.
          Mark paid after the bank transfer. <Link to="/accounting">Accounting</Link> shows monthly
          succeeded payments (currency, VAT, and type).
        </p>
      </section>

      <section className="card">
        <h2>If the desk looks empty or errors</h2>
        <p>
          Run <Link to="/connection">Connection check</Link> to confirm the browser can reach the
          support server. List pages also need <code>CLIENT_API_URL</code> and{" "}
          <code>SUPPORT_INTERNAL_API_KEY</code> on that server.
        </p>
      </section>

      <section className="card">
        <h2>Email alerts</h2>
        <p>
          Toggle email notifications in <Link to="/settings">Settings</Link>. There is no in-browser
          notification inbox yet — that would need an API the app does not have.
        </p>
      </section>
    </AppShell>
  );
}
