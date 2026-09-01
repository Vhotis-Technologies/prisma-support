import type { SubscriptionComplimentarySnapshot } from "../types/customer";
import { formatDate } from "../lib/format";

type ComplimentaryWashesCardProps = {
  complimentary?: SubscriptionComplimentarySnapshot;
};

export default function ComplimentaryWashesCard({ complimentary }: ComplimentaryWashesCardProps) {
  if (!complimentary || complimentary.max_subscription <= 0) return null;

  const max = complimentary.max_subscription;
  const remaining = Math.max(0, Math.min(max, complimentary.remaining_subscription));
  const used = Math.max(0, max - remaining);
  const remainingPct = max > 0 ? Math.round((remaining / max) * 100) : 0;
  const periodEnd = complimentary.period_end ? formatDate(complimentary.period_end) : "";
  const periodStart = complimentary.period_start ? formatDate(complimentary.period_start) : "";

  return (
    <section className="card">
      <div className="card-row">
        <h2>Complimentary washes</h2>
        <span className="pill pill-pending">
          {remaining} of {max} left
        </span>
      </div>
      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${remainingPct}%` }} />
      </div>
      <div className="spend-row">
        <span>Used: {used}</span>
        <span>Allowance: {max}</span>
      </div>
      <p className="muted">
        {periodStart && periodEnd ? `Resets on ${periodEnd}` : "Resets with the next billing period"}
      </p>
    </section>
  );
}
