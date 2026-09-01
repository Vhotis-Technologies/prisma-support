type EmptyStateProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
};

/** List/detail empty copy. Pass `actionLabel` + `onAction` for a Retry control. */
export default function EmptyState({
  message,
  actionLabel,
  onAction,
  actionDisabled,
}: EmptyStateProps) {
  return (
    <div className="empty-block">
      <p className="muted">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="btn btn-ghost"
          disabled={actionDisabled}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
