/**
 * Shared helpers: getStatusColor, formatCurrency, etc. Used across dashboard and booking.
 */


export const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "#10B981";
    case "inprogress":
      return "#F59E0B";
    case "pending":
      return "#3B82F6";
    case "cancelled":
      return "#EF4444"; // Red
    default:
      return "#6B7280"; // Gray
  }
};

export const formatDate = (dateString: string) => {
  if (!dateString || dateString.trim() === "") {
    return "N/A";
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return date.toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format the currency based on the users country.
 * The method uses the users stored address to determine what country they are in.
 * If the country is not supported, the method will default to EUR.
 *
 * @param amount - The amount to format
 * @param country - The user's country (optional)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, country?: string) => {
  if (country && country.toLocaleUpperCase() === "united kingdom") {
    return amount.toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
    });
  } else if (country && country.toLocaleUpperCase() === "ireland") {
    return amount.toLocaleString("en-GB", {
      style: "currency",
      currency: "EUR",
    });
  } else {
    return amount.toLocaleString("en-GB", {
      style: "currency",
      currency: "EUR",
    });
  }
};


export const formatDuration = (duration: number) => {
  if (duration < 60) {
    return `${duration}m`;
  } else {
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  }
};

/** Support app: staff role from API → short label */
export function formatSupportStaffRole(role: string): string {
  const map: Record<string, string> = {
    admin: "Admin",
    support: "Support",
  };
  return map[role] ?? role;
}

export function formatSupportFullName(first: string, last: string): string {
  return [first, last].map((s) => s?.trim()).filter(Boolean).join(" ");
}

export function formatSupportGender(code: string | null | undefined): string {
  if (!code) return "—";
  const map: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
  };
  return map[code] ?? code;
}

export function supportSubscriptionListLabel(sub: {
  status?: string;
  is_trial?: boolean;
  subtype?: string;
}): string {
  if (!sub?.subtype || sub.subtype === "No plan") return "No subscription";
  if (sub.status === "terminated") return "Subscription terminated";
  if (sub.status === "expired") return "Subscription expired";
  if (sub.status === "pending") return "Pending payment";
  if (sub.status === "past_due") return "Past due";
  if (sub.status === "trialing" || sub.is_trial) return "Trial subscription";
  if (sub.status === "active") return "Subscribed";
  return sub.status ? sub.status.replace(/_/g, " ") : "No subscription";
}

export function supportSubscriptionListTone(
  sub: { status?: string; is_trial?: boolean; subtype?: string },
  colors: { success: string; warning: string; error: string; muted: string },
): string {
  if (!sub?.subtype || sub.subtype === "No plan") return colors.muted;
  if (sub.status === "terminated" || sub.status === "expired") return colors.error;
  if (
    sub.status === "pending" ||
    sub.status === "past_due" ||
    sub.status === "trialing" ||
    sub.is_trial
  ) {
    return colors.warning;
  }
  if (sub.status === "active") return colors.success;
  return colors.muted;
}

export function formatSupportDob(isoDate: string | null | undefined): string {
  if (!isoDate?.trim()) return "—";
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function guestAccessLabel(
  access: { status?: string; expires_at?: string | null } | null | undefined,
): string {
  if (!access) return "No link issued";
  switch (access.status) {
    case "active":
      return access.expires_at
        ? `Active until ${new Date(access.expires_at).toLocaleString("en-GB")}`
        : "Active";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    default:
      return "No link issued";
  }
}

// Satisfy Expo Router: this file is a util module under app/, not a screen.
export default function MethodsRoute() {
  return null;
}