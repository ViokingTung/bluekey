import { cn } from "../../lib/utils";

export interface RadarVizProps {
  active?: boolean;
  size?: number;
  className?: string;
}

export function RadarViz({ active = false, size = 120, className }: RadarVizProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Background rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full border border-border-soft opacity-30" />
        <div className="absolute w-[75%] h-[75%] rounded-full border border-border-soft opacity-40" />
        <div className="absolute w-[50%] h-[50%] rounded-full border border-border-soft opacity-50" />
        <div className="absolute w-[25%] h-[25%] rounded-full border border-border-soft opacity-60" />
      </div>

      {/* Center dot */}
      <div
        className={cn(
          "absolute w-2 h-2 rounded-full z-10",
          active ? "bg-accent shadow-[0_0_12px_var(--accent)]" : "bg-text-muted"
        )}
      />

      {/* Pulse rings when active */}
      {active && (
        <>
          <div
            className="absolute w-8 h-8 rounded-full border-2 border-accent radar-pulse"
            style={{ animationDuration: "2s" }}
          />
          <div
            className="absolute w-8 h-8 rounded-full border-2 border-accent radar-pulse"
            style={{ animationDuration: "2s", animationDelay: "0.5s" }}
          />
        </>
      )}

      {/* Scanning sweep line */}
      {active && (
        <div
          className="absolute w-1/2 h-[1.5px] origin-left bg-gradient-to-r from-accent to-transparent"
          style={{
            animation: "radar-sweep 3s linear infinite",
          }}
        />
      )}

      <style>{`
        @keyframes radar-sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Distance ring visualization for device proximity
export interface DistanceRingProps {
  distance: number; // Distance in meters
  maxDistance?: number; // Maximum detection range
  size?: number;
  className?: string;
}

export function DistanceRing({ distance, maxDistance = 10, size = 80, className }: DistanceRingProps) {
  // Calculate ring size based on distance (closer = larger ring fill)
  const fillPercent = Math.max(0, Math.min(100, ((maxDistance - distance) / maxDistance) * 100));

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer ring */}
      <div className="absolute w-full h-full rounded-full border-2 border-border opacity-40" />

      {/* Inner fill based on distance */}
      <div
        className="absolute rounded-full border-2 border-accent/50"
        style={{
          width: `${fillPercent}%`,
          height: `${fillPercent}%`,
          background: `radial-gradient(circle, var(--accent-20) 0%, transparent 70%)`,
        }}
      />

      {/* Center */}
      <div className="absolute w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />

      {/* Distance label */}
      <div className="absolute -bottom-5 text-[10px] font-mono text-text-muted">
        {distance.toFixed(1)}m
      </div>
    </div>
  );
}
