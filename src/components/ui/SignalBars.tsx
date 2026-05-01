import { cn } from "../../lib/utils";

export interface SignalBarsProps {
  rssi: number; // RSSI value in dBm (typically -30 to -100)
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

// Convert RSSI to signal level (0-4)
function rssiToLevel(rssi: number): number {
  if (rssi >= -50) return 4;
  if (rssi >= -60) return 3;
  if (rssi >= -70) return 2;
  if (rssi >= -80) return 1;
  return 0;
}

// Get color based on signal level
function getLevelColor(level: number): string {
  if (level >= 3) return "bg-success";
  if (level >= 2) return "bg-warning";
  if (level >= 1) return "bg-warning/70";
  return "bg-danger";
}

export function SignalBars({ rssi, size = "md", animated = false, className }: SignalBarsProps) {
  const level = rssiToLevel(rssi);
  const color = getLevelColor(level);

  const barHeights = {
    sm: ["h-1", "h-2", "h-2.5", "h-3"],
    md: ["h-1.5", "h-2.5", "h-3.5", "h-4.5"],
    lg: ["h-2", "h-3", "h-4", "h-5"],
  };

  const barWidth = size === "sm" ? "w-0.5" : size === "lg" ? "w-1" : "w-0.75";
  const gap = size === "sm" ? "gap-[1.5px]" : size === "lg" ? "gap-[2.5px]" : "gap-[2px]";

  return (
    <div className={cn("flex items-end", gap, className)}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            barWidth,
            barHeights[size][i],
            "rounded-[0.5px] transition-all duration-300",
            i < level ? color : "bg-text-muted/30",
            animated && i < level && "signal-wobble"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Compact inline signal display
export interface SignalInlineProps {
  rssi: number;
  showValue?: boolean;
  className?: string;
}

export function SignalInline({ rssi, showValue = true, className }: SignalInlineProps) {
  const level = rssiToLevel(rssi);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <SignalBars rssi={rssi} size="sm" />
      {showValue && (
        <span className={cn("text-[10px] font-mono", level >= 2 ? "text-text-soft" : "text-text-muted")}>
          {rssi}dBm
        </span>
      )}
    </div>
  );
}
