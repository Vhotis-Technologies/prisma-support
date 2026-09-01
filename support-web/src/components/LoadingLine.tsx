/** Polite loading copy. Do not use `Date.now()` here. */
export default function LoadingLine({ children }: { children: string }) {
  return (
    <p className="muted" role="status" aria-live="polite" aria-busy="true">
      {children}
    </p>
  );
}
