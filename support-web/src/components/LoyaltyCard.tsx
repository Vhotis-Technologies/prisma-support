import type { LoyaltyProgressSnapshot, LoyaltyTier } from "../types/customer";
import { tierPillClass } from "../lib/format";

const TIER_LABEL: Record<LoyaltyTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

type LoyaltyCardProps = {
  loyalty?: LoyaltyProgressSnapshot;
};

export default function LoyaltyCard({ loyalty }: LoyaltyCardProps) {
  if (!loyalty || !loyalty.is_b2c || !loyalty.current_tier) return null;

  const tier = loyalty.current_tier;
  const isTopTier = loyalty.next_tier === null;
  const completed = loyalty.completed_bookings;
  const lowerBound = loyalty.current_threshold;
  const upperBound = loyalty.next_threshold ?? lowerBound;
  const span = Math.max(1, upperBound - lowerBound);
  const within = Math.max(0, Math.min(span, completed - lowerBound));
  const pct = isTopTier ? 100 : Math.round((within / span) * 100);
  const benefits = loyalty.benefits ?? { discount: 0, free_service: [] };
  const services = Array.isArray(benefits.free_service) ? benefits.free_service : [];

  return (
    <section className="card">
      <div className="card-row">
        <h2>Loyalty programme</h2>
        <span className={tierPillClass(tier)}>{TIER_LABEL[tier]}</span>
      </div>
      <div className="spend-row">
        <span>
          {completed} completed wash{completed === 1 ? "" : "es"}
        </span>
        <span>
          {isTopTier
            ? "Top tier reached"
            : `${loyalty.washes_to_next} to ${TIER_LABEL[loyalty.next_tier as LoyaltyTier]}`}
        </span>
      </div>
      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {!isTopTier ? (
        <p className="muted">
          {lowerBound} → {upperBound} washes
        </p>
      ) : null}
      <p className="field-label">Tier benefits</p>
      <ul className="benefit-list">
        <li>
          {benefits.discount > 0
            ? `${benefits.discount}% off paid bookings`
            : "No service discount"}
        </li>
        {services.length === 0 ? (
          <li>No complimentary perks yet</li>
        ) : (
          services.map((label) => <li key={label}>{label}</li>)
        )}
      </ul>
    </section>
  );
}
