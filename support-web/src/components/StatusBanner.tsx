import type { Notice } from "../lib/load";

type StatusBannerProps = {
  notice: Notice | null | undefined;
  onDismiss?: () => void;
};

/** Success/error strip after a mutation. Omit `onDismiss` for persistent load errors. */
export default function StatusBanner({ notice, onDismiss }: StatusBannerProps) {
  if (!notice) return null;
  return (
    <div
      className={`banner ${notice.type === "ok" ? "banner-ok" : "banner-error"}`}
      role={notice.type === "error" ? "alert" : "status"}
    >
      <span>{notice.message}</span>
      {onDismiss ? (
        <button type="button" className="text-btn" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
