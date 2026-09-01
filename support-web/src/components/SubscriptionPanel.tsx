import type { FleetSubscription } from "../types/customer";
import {
  formatDateTime,
  subscriptionLabel,
  subscriptionPillClass,
} from "../lib/format";

type SubscriptionPanelProps = {
  subscription: FleetSubscription | null | undefined;
  busy?: boolean;
  onTerminate: () => void;
  onRenew: () => void;
};

export default function SubscriptionPanel({
  subscription,
  busy = false,
  onTerminate,
  onRenew,
}: SubscriptionPanelProps) {
  const disabledTerminate =
    busy ||
    !subscription ||
    subscription.status === "terminated" ||
    subscription.subtype === "No plan";
  const disabledRenew = busy || !subscription || subscription.subtype === "No plan";

  return (
    <section className="card">
      <div className="card-row">
        <h2>Subscription</h2>
        <span className={subscriptionPillClass(subscription)}>
          {subscriptionLabel(subscription)}
        </span>
      </div>
      <dl className="meta meta-2">
        <div>
          <dt>Plan</dt>
          <dd>{subscription?.subtype?.trim() ? subscription.subtype : "N/A"}</dd>
        </div>
        <div>
          <dt>Billing</dt>
          <dd>{subscription?.billing_type ?? "N/A"}</dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{formatDateTime(subscription?.started_at)}</dd>
        </div>
        <div>
          <dt>Trial</dt>
          <dd>{subscription?.is_trial ? "Yes" : "No"}</dd>
        </div>
        {subscription?.is_trial && subscription.trial_ends_at ? (
          <div>
            <dt>Trial ends</dt>
            <dd>{formatDateTime(subscription.trial_ends_at)}</dd>
          </div>
        ) : null}
        <div>
          <dt>{subscription?.is_trial ? "Current period ends" : "Renews / period ends"}</dt>
          <dd>{formatDateTime(subscription?.ends_at)}</dd>
        </div>
        <div>
          <dt>Last paid</dt>
          <dd>{subscription?.last_paid_at ? formatDateTime(subscription.last_paid_at) : "Never"}</dd>
        </div>
        {subscription?.terminated_at ? (
          <div>
            <dt>Terminated</dt>
            <dd>{formatDateTime(subscription.terminated_at)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="card-actions">
        <button
          type="button"
          className="btn btn-danger"
          disabled={disabledTerminate}
          onClick={onTerminate}
        >
          Terminate subscription
        </button>
        <button type="button" className="btn btn-ghost" disabled={disabledRenew} onClick={onRenew}>
          Renew subscription
        </button>
      </div>
    </section>
  );
}
