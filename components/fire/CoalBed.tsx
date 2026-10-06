/**
 * A bed of live coals: the photo tiled seamlessly, a slow breathing glow
 * and a few hot spots that flare out of step with each other. Pure CSS —
 * sparks come from an <EmberCanvas> placed in the same section.
 */
export default function CoalBed({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`coal-bed ${className}`}>
      <div className="coal-bed__coals" />
      <div className="coal-bed__heat" />
      <span className="coal-bed__flare" style={{ left: "12%", animationDelay: "-1.2s" }} />
      <span className="coal-bed__flare" style={{ left: "38%", animationDelay: "-3.1s" }} />
      <span className="coal-bed__flare" style={{ left: "63%", animationDelay: "-0.4s" }} />
      <span className="coal-bed__flare" style={{ left: "86%", animationDelay: "-2.2s" }} />
    </div>
  );
}
