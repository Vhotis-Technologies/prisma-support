/**
 * Shared personal-data export preview + download/email actions for support.
 * Used on B2C, fleet, and partner detail pages.
 */
import { useCallback, useEffect, useState } from "react";
import {
  downloadUserDataPdf,
  emailUserDataPdf,
  getCustomerDataExport,
  type CustomerDataExport,
  type ExportEntityType,
} from "../store/api/customerApi";
import { loadError, type Notice } from "../lib/load";

function isMailableEmail(email: string | undefined): boolean {
  const value = (email || "").trim();
  return Boolean(value && !value.endsWith("@prisma.invalid") && value.includes("@"));
}

function fmtMoney(amount: string | number | null | undefined): string {
  if (amount == null || amount === "") return "—";
  const n = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return `€${n.toFixed(2)}`;
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  entityType: ExportEntityType;
  entityId: string;
  defaultEmail?: string;
  onNotice?: (notice: Notice) => void;
};

export default function PersonalDataExportPanel({
  entityType,
  entityId,
  defaultEmail,
  onNotice,
}: Props) {
  const [exportData, setExportData] = useState<CustomerDataExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    void getCustomerDataExport(entityType, entityId)
      .then((data) => {
        setExportData(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(loadError(err, "Could not load personal data package"));
        setLoading(false);
      });
  }, [entityId, entityType]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (notice: Notice) => onNotice?.(notice);

  const onDownload = async () => {
    setBusy(true);
    try {
      await downloadUserDataPdf(entityType, entityId);
      notify({ type: "ok", message: "Personal data PDF downloaded." });
    } catch (err: unknown) {
      notify({ type: "error", message: loadError(err, "Could not download PDF") });
    } finally {
      setBusy(false);
    }
  };

  const onEmail = async () => {
    let recipient = isMailableEmail(defaultEmail) ? defaultEmail!.trim() : undefined;
    if (!recipient && isMailableEmail(exportData?.recipient_hint)) {
      recipient = exportData!.recipient_hint!.trim();
    }
    if (!recipient) {
      const override = window.prompt(
        "No mailable email on file. Enter the address to send the export to:",
      );
      recipient = (override || "").trim() || undefined;
    }
    if (!recipient) {
      notify({ type: "error", message: "A recipient email is required." });
      return;
    }
    if (!window.confirm(`Email the personal data PDF to ${recipient}?`)) return;

    const needsOverride =
      !isMailableEmail(defaultEmail) && !isMailableEmail(exportData?.recipient_hint);

    setBusy(true);
    try {
      const queued = await emailUserDataPdf({
        entity_type: entityType,
        entity_id: entityId,
        ...(needsOverride ? { recipient_email: recipient } : {}),
      });
      notify({
        type: "ok",
        message: queued.message || `Export queued for ${recipient}.`,
      });
    } catch (err: unknown) {
      notify({ type: "error", message: loadError(err, "Could not email data export") });
    } finally {
      setBusy(false);
    }
  };

  const profile = exportData?.profile;
  const fleet = exportData?.fleet;
  const partner = exportData?.partner;

  return (
    <section className="card">
      <div className="card-row">
        <h2>Personal data (GDPR)</h2>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide package" : "Review package"}
        </button>
      </div>
      <p className="muted">
        Preview the data package we would send for a subject-access request, then download or email
        the PDF to the customer&apos;s registered address.
      </p>
      <div className="card-actions">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || loading}
          onClick={() => void onDownload()}
        >
          {busy ? "Working…" : "Download PDF"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy || loading}
          onClick={() => void onEmail()}
        >
          Email to customer
        </button>
        <button type="button" className="btn btn-ghost" disabled={loading} onClick={load}>
          Refresh
        </button>
      </div>

      {loading ? <p className="muted">Loading data package…</p> : null}
      {error ? <p className="lede">{error}</p> : null}

      {open && exportData && !loading ? (
        <div className="data-export-preview" style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
          <p className="muted">
            {exportData.title} · Generated {fmtDate(exportData.generated_at)}
          </p>

          {profile ? (
            <div>
              <h3>Profile</h3>
              <dl className="meta meta-2">
                <div>
                  <dt>Name</dt>
                  <dd>{profile.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{profile.phone}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {profile.account_status}
                    {profile.is_guest ? " · Guest" : ""}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {fleet ? (
            <div>
              <h3>Fleet</h3>
              <dl className="meta meta-2">
                <div>
                  <dt>Name</dt>
                  <dd>{fleet.name}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>
                    {fleet.owner_name} ({fleet.owner_email})
                  </dd>
                </div>
                <div>
                  <dt>Bookings</dt>
                  <dd>{fleet.total_bookings}</dd>
                </div>
                <div>
                  <dt>Spend</dt>
                  <dd>{fmtMoney(fleet.total_spend)}</dd>
                </div>
                <div>
                  <dt>Branches</dt>
                  <dd>{fleet.branches?.length ?? 0}</dd>
                </div>
                <div>
                  <dt>Admins</dt>
                  <dd>{fleet.admins?.length ?? 0}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {partner ? (
            <div>
              <h3>Partner</h3>
              <dl className="meta meta-2">
                <div>
                  <dt>Business</dt>
                  <dd>{partner.business_name}</dd>
                </div>
                <div>
                  <dt>Referral code</dt>
                  <dd>{partner.referral_code}</dd>
                </div>
                <div>
                  <dt>Referred</dt>
                  <dd>{partner.total_referred}</dd>
                </div>
                <div>
                  <dt>Bank</dt>
                  <dd>
                    {partner.bank_account
                      ? `${partner.bank_account.account_holder_name} · ${partner.bank_account.iban_masked}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div>
            <h3>Summary counts</h3>
            <dl className="meta meta-2">
              <div>
                <dt>Addresses</dt>
                <dd>{exportData.addresses?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Vehicles</dt>
                <dd>{exportData.vehicles?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Bookings</dt>
                <dd>{exportData.bookings?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Payments</dt>
                <dd>{exportData.payments?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Refunds</dt>
                <dd>{exportData.refunds?.length ?? 0}</dd>
              </div>
              <div>
                <dt>Referrals</dt>
                <dd>{exportData.referrals?.length ?? 0}</dd>
              </div>
            </dl>
          </div>

          {(exportData.bookings?.length ?? 0) > 0 ? (
            <div>
              <h3>Recent bookings</h3>
              <ul className="muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {exportData.bookings?.slice(0, 8).map((b) => (
                  <li key={b.reference}>
                    {b.reference} · {b.status} · {fmtDate(b.appointment_date)} · {b.service} ·{" "}
                    {fmtMoney(b.total)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {(exportData.vehicles?.length ?? 0) > 0 ? (
            <div>
              <h3>Vehicles</h3>
              <ul className="muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {exportData.vehicles?.slice(0, 12).map((v, idx) => (
                  <li key={`${v.registration}-${idx}`}>
                    {v.registration} · {v.make} {v.model} ({v.year})
                    {v.branch ? ` · ${v.branch}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
