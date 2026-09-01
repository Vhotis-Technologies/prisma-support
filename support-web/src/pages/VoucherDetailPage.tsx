import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import { useVoucherFlow } from "../app-hooks/useVoucherFlow";
import {
  formatTimestamp,
  formatVoucherCredit,
  voucherCodeDisplay,
  voucherPillClass,
  voucherStatusLabel,
} from "../lib/format";
import { getVoucherDisplayStatus } from "../types/voucher";
import type { VoucherKind } from "../types/voucher";

function asVoucherKind(raw: string | undefined): VoucherKind | null {
  if (raw === "winner" || raw === "gift") return raw;
  return null;
}

export default function VoucherDetailPage() {
  const { kind: kindParam, voucherId = "" } = useParams<{
    kind: string;
    voucherId: string;
  }>();
  const kind = asVoucherKind(kindParam);
  const flow = useVoucherFlow(kind ? voucherId : "", kind ?? "winner");
  const {
    voucher,
    isLoading,
    isError,
    errorMessage,
    nowMs,
    notice,
    clearNotice,
    refetch,
    canDeactivate,
    requestDeactivate,
  } = flow;

  if (!kind || !voucherId || (isError && !isLoading && !voucher)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/vouchers">Vouchers</Link>
        </p>
        <h1 className="page-title">Voucher not found</h1>
        <p className="lede">{kind ? errorMessage : "This voucher link is invalid."}</p>
        {kind ? (
          <div className="card-actions">
            <button type="button" className="btn btn-ghost" onClick={refetch}>
              Retry
            </button>
          </div>
        ) : null}
      </AppShell>
    );
  }

  if (isLoading || !voucher) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/vouchers">Vouchers</Link>
        </p>
        <h1 className="page-title">Voucher</h1>
        <p className="muted">Loading voucher…</p>
      </AppShell>
    );
  }

  const status = getVoucherDisplayStatus(voucher, nowMs);
  const gift = voucher.kind === "gift" ? voucher : null;
  const paymentLine = gift?.paymentAmount
    ? `${gift.paymentAmount} ${(gift.paymentCurrency || "").toUpperCase()}${
        gift.paymentLast4
          ? ` · ${gift.paymentCardBrand || "Card"} ·••• ${gift.paymentLast4}`
          : ""
      }`
    : "—";

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/vouchers">Vouchers</Link>
          {" · "}
          {voucher.kind === "gift" ? "Gifting" : "Winner"}
        </p>
        <h1 className="page-title">{voucherCodeDisplay(voucher)}</h1>
        <p className="lede">{formatVoucherCredit(voucher.creditAmount)}</p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="card">
        <div className="card-row">
          <div>
            <p className="stat-label">Credit</p>
            <p className="stat-value">{formatVoucherCredit(voucher.creditAmount)}</p>
          </div>
          <span className={voucherPillClass(status)}>{voucherStatusLabel(status)}</span>
        </div>
        {canDeactivate ? (
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-danger"
              disabled={flow.confirmBusy}
              onClick={requestDeactivate}
            >
              Deactivate voucher
            </button>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Assignment</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Assigned email</dt>
            <dd>{voucher.assignedEmail}</dd>
          </div>
          <div>
            <dt>Linked user</dt>
            <dd>{voucher.assignedUserLabel ?? "Not linked yet"}</dd>
          </div>
        </dl>
      </section>

      {gift ? (
        <section className="card">
          <h2>Purchase</h2>
          <dl className="meta meta-2">
            <div>
              <dt>Purchaser</dt>
              <dd>{gift.purchaserLabel ?? gift.purchaserEmail ?? "—"}</dd>
            </div>
            <div>
              <dt>Purchaser email</dt>
              <dd>{gift.purchaserEmail ?? "—"}</dd>
            </div>
            <div>
              <dt>Use window</dt>
              <dd>{gift.validityDays} days (from payment)</dd>
            </div>
            <div>
              <dt>Charge currency</dt>
              <dd>{(gift.purchaseCurrency || "eur").toUpperCase()}</dd>
            </div>
            <div>
              <dt>Recipient email sent</dt>
              <dd>{gift.emailSentAt ? formatTimestamp(gift.emailSentAt) : "—"}</dd>
            </div>
            <div>
              <dt>Payment captured</dt>
              <dd>{paymentLine}</dd>
            </div>
            <div>
              <dt>Stripe payment intent</dt>
              <dd>{gift.stripePaymentIntentId ?? "—"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="card">
        <h2>Validity</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Active flag</dt>
            <dd>{voucher.isActive ? "Yes" : "No"}</dd>
          </div>
          {gift ? (
            <div>
              <dt>Chosen validity (purchase)</dt>
              <dd>{gift.validityDays} days</dd>
            </div>
          ) : null}
          <div>
            <dt>Valid from</dt>
            <dd>{voucher.validFrom ? formatTimestamp(voucher.validFrom) : "—"}</dd>
          </div>
          <div>
            <dt>Expires at</dt>
            <dd>{voucher.expiresAt ? formatTimestamp(voucher.expiresAt) : "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Redemption</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Redeemed at</dt>
            <dd>{voucher.redeemedAt ? formatTimestamp(voucher.redeemedAt) : "—"}</dd>
          </div>
          <div>
            <dt>Booking reference</dt>
            <dd>{voucher.consumedBookingRef ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Record</h2>
        <dl className="meta">
          <div>
            <dt>Internal ID</dt>
            <dd>{voucher.id}</dd>
          </div>
          <div>
            <dt>Created at</dt>
            <dd>{formatTimestamp(voucher.createdAt)}</dd>
          </div>
        </dl>
      </section>

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
