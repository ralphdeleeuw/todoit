"use client";

// Pulserende placeholder rechthoek in arcade stijl
export function SkeletonBlock({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className}`}
      style={{ background: "var(--arc-panel-2)", ...style }}
    />
  );
}

// Volledige paginaskeleton met bottom nav placeholder
export function ArcadePageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {children}
    </div>
  );
}
