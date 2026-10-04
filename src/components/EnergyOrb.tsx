import { lazy, Suspense } from "react";
const EnergyOrbScene = lazy(() => import("./EnergyOrbScene"));
export default function EnergyOrb({ className = "" }: { className?: string }) {
  return (
    <Suspense
      fallback={
        <div
          className={`energy-orb ${className}`}
          aria-hidden="true"
          data-renderer="loading"
        >
          <div className="energy-orb-fallback live-orb-fallback">
            <span />
            <span />
            <span />
          </div>
        </div>
      }
    >
      <EnergyOrbScene className={className} />
    </Suspense>
  );
}
