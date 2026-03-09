"use client";

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full min-h-0 w-full min-w-0 max-w-full overflow-hidden bg-background">
      {/* Simple gradient wash — no shapes, no animation */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30 dark:to-muted/20" />
      </div>

      <div className="relative z-10 h-full min-h-0 min-w-0 w-full max-w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
