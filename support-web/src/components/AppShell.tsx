import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/context";
import BrandMark from "./BrandMark";
import { supportFullName, supportInitial, supportRoleLabel } from "../lib/format";

type AppShellProps = {
  children: ReactNode;
};

type NavIcon =
  | "home"
  | "bookings"
  | "crew"
  | "customers"
  | "activities"
  | "tickets"
  | "chats"
  | "vouchers"
  | "payouts"
  | "accounting"
  | "bell"
  | "settings"
  | "help";

type NavItem = {
  to: string;
  label: string;
  icon: NavIcon;
  match?: "exact" | "prefix";
};

const WORK: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "home", match: "exact" },
  { to: "/bookings", label: "Bookings", icon: "bookings" },
  { to: "/crew", label: "Prisma Crew", icon: "crew" },
  { to: "/customers", label: "Customers", icon: "customers" },
  { to: "/activities", label: "Activities", icon: "activities" },
  { to: "/tickets", label: "Tickets", icon: "tickets" },
  { to: "/crew-chats", label: "Crew Chats", icon: "chats" },
  { to: "/vouchers", label: "Vouchers", icon: "vouchers" },
  { to: "/payouts", label: "Payouts", icon: "payouts" },
  { to: "/accounting", label: "Accounting", icon: "accounting" },
];

const ACCOUNT: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: "bell", match: "exact" },
  { to: "/settings", label: "Settings", icon: "settings", match: "exact" },
  { to: "/help", label: "Help", icon: "help", match: "exact" },
];

function isItemActive(item: NavItem, pathname: string): boolean {
  // Prefix match keeps /crew/:id (and bookings/customers) highlighted in the sidebar.
  if (item.match === "exact") return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function documentTitle(pathname: string): string {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/dashboard" || path === "/") return "Dashboard";
  if (path.startsWith("/bookings/bulk/")) return "Bulk order";
  if (path.startsWith("/bookings/")) return "Booking";
  if (path === "/bookings") return "Bookings";
  if (path.startsWith("/crew/")) return "Crew profile";
  if (path === "/crew") return "Prisma Crew";
  if (path.startsWith("/customers/vehicles/")) return "Vehicle";
  if (path.includes("/branches/")) return "Branch";
  if (path.includes("/referred")) return "Referred users";
  if (path.startsWith("/customers/fleets/")) return "Fleet";
  if (path.startsWith("/customers/partners/")) return "Partner";
  if (path.startsWith("/customers/b2c/")) return "Customer";
  if (path === "/customers") return "Customers";
  if (path.startsWith("/tickets/")) return "Ticket";
  if (path === "/tickets") return "Tickets";
  if (path.startsWith("/crew-chats/")) return "Crew Chat";
  if (path === "/crew-chats") return "Crew Chats";
  if (path === "/activities") return "Activities";
  if (path.startsWith("/vouchers/")) return "Voucher";
  if (path === "/vouchers") return "Vouchers";
  if (path.startsWith("/payouts/unpaid/")) return "Unpaid earnings";
  if (path.startsWith("/payouts/")) return "Payout";
  if (path === "/payouts") return "Payouts";
  if (path.startsWith("/accounting/")) return "Accounting month";
  if (path === "/accounting") return "Accounting";
  if (path === "/settings") return "Settings";
  if (path === "/profile") return "Profile";
  if (path === "/help") return "Help";
  if (path === "/notifications") return "Notifications";
  if (path === "/connection") return "Connection check";
  return "Support";
}

function Icon({ name }: { name: NavIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "bookings":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 11h16" />
        </svg>
      );
    case "crew":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="16" cy="9" r="2.4" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0M13 19a4.5 4.5 0 0 1 7.5-3.2" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      );
    case "activities":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 1.5M9 5 7 3M15 5l2-2" />
        </svg>
      );
    case "tickets":
      return (
        <svg {...common}>
          <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z" />
          <path d="M12 7v12" />
        </svg>
      );
    case "chats":
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "vouchers":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M4.9 6.5l2.8 2.8M16.3 14.7l2.8 2.8M3 12h4M17 12h4M4.9 17.5l2.8-2.8M16.3 9.3l2.8-2.8" />
        </svg>
      );
    case "payouts":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18M12 15h.01" />
        </svg>
      );
    case "accounting":
      return (
        <svg {...common}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v4h4M9 12h6M9 16h6" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4 1-1.4 1.9V14" />
          <path d="M12 17h.01" />
        </svg>
      );
  }
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuForPath, setMenuForPath] = useState<string | null>(null);
  const open = menuForPath === location.pathname;

  useEffect(() => {
    document.title = `${documentTitle(location.pathname)} · Prisma Support`;
  }, [location.pathname]);

  function renderItems(items: NavItem[]) {
    return items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.match === "exact"}
        className={() => (isItemActive(item, location.pathname) ? "is-active" : undefined)}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </NavLink>
    ));
  }

  return (
    <div className={`shell${open ? " is-nav-open" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="shell-topbar">
        <button
          type="button"
          className="shell-menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={() =>
            setMenuForPath((current) => (current === location.pathname ? null : location.pathname))
          }
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
        <BrandMark />
      </header>

      <div className="shell-scrim" hidden={!open} onClick={() => setMenuForPath(null)} />

      <aside id="app-sidebar" className="shell-sidebar">
        <div className="shell-sidebar-brand">
          <BrandMark />
        </div>
        <nav className="shell-nav" aria-label="Main">
          <p className="shell-nav-label">Work</p>
          {renderItems(WORK)}
          <p className="shell-nav-label">Account</p>
          {renderItems(ACCOUNT)}
        </nav>
        <div className="shell-sidebar-end">
          {user ? (
            <NavLink
              to="/profile"
              end
              className={({ isActive }) => `shell-user${isActive ? " is-active" : ""}`}
              aria-label="Open profile"
            >
              <span className="shell-avatar" aria-hidden="true">
                {supportInitial(user)}
              </span>
              <span className="shell-user-meta">
                <strong>{supportFullName(user)}</strong>
                <span>
                  {supportRoleLabel(user.role)} · {user.email}
                </span>
              </span>
            </NavLink>
          ) : null}
          <button
            type="button"
            className="shell-logout"
            onClick={() => {
              const ok = window.confirm("Log out of this account?");
              if (!ok) return;
              logout();
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main id="main" className="shell-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
