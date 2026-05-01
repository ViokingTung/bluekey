import { useMemo } from "react";
import { cn } from "../../lib/utils";

export interface SignalChartProps {
  data: SignalDataPoint[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export interface SignalDataPoint {
  timestamp: number;
  rssi: number;
  distance?: number;
  status?: "InRange" | "NearRange" | "OutOfRange";
}

export function SignalChart({
  data,
  height = 120,
  showGrid = true,
  showLabels = true,
  className,
}: SignalChartProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    if (data.length === 0) return { min: -100, max: -30, avg: -60 };
    const rssiValues = data.map((d) => d.rssi);
    return {
      min: Math.min(...rssiValues),
      max: Math.max(...rssiValues),
      avg: Math.round(rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length),
    };
  }, [data]);

  // Scale functions
  const scaleY = (rssi: number) => {
    const range = stats.max - stats.min;
    if (range === 0) return height / 2;
    return ((stats.max - rssi) / range) * height;
  };

  const scaleX = (index: number) => {
    if (data.length <= 1) return 0;
    return (index / (data.length - 1)) * 100;
  };

  // Generate path for line
  const linePath = useMemo(() => {
    if (data.length === 0) return "";
    return data
      .map((point, i) => {
        const x = scaleX(i);
        const y = scaleY(point.rssi);
        return `${i === 0 ? "M" : "L"} ${x}% ${y}`;
      })
      .join(" ");
  }, [data, stats]);

  // Generate area path
  const areaPath = useMemo(() => {
    if (data.length === 0) return "";
    const linePoints = data
      .map((point, i) => {
        const x = scaleX(i);
        const y = scaleY(point.rssi);
        return `${x}% ${y}`;
      })
      .join(" L ");
    return `M 0% ${height} L ${linePoints} L 100% ${height} Z`;
  }, [data, stats, height]);

  // Get color based on RSSI
  const getRssiColor = (rssi: number) => {
    if (rssi >= -50) return "var(--color-success)";
    if (rssi >= -70) return "var(--color-warning)";
    return "var(--color-danger)";
  };

  // Get gradient stops
  const gradientStops = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((point, i) => ({
      offset: `${scaleX(i)}%`,
      color: getRssiColor(point.rssi),
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center bg-surface/30 rounded-lg", className)}
        style={{ height }}
      >
        <span className="text-xs text-text-muted">暂无数据</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Y-axis labels */}
      {showLabels && (
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[10px] text-text-muted font-mono">
          <span>{stats.max}dBm</span>
          <span>{stats.avg}dBm</span>
          <span>{stats.min}dBm</span>
        </div>
      )}

      {/* Chart container */}
      <div className={cn(showLabels && "ml-10")}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="rssiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={0.3} />
              ))}
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {showGrid && (
            <g className="opacity-30">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <line
                  key={i}
                  x1="0%"
                  y1={height * ratio}
                  x2="100%"
                  y2={height * ratio}
                  stroke="var(--color-border)"
                  strokeWidth="0.5"
                  strokeDasharray={ratio === 0.5 ? "none" : "2 2"}
                />
              ))}
            </g>
          )}

          {/* Range zones */}
          <rect x="0%" y="0%" width="100%" height={scaleY(-50)} fill="var(--color-success)" opacity={0.05} />
          <rect x="0%" y={scaleY(-50)} width="100%" height={scaleY(-70) - scaleY(-50)} fill="var(--color-warning)" opacity={0.05} />
          <rect x="0%" y={scaleY(-70)} width="100%" height={height - scaleY(-70)} fill="var(--color-danger)" opacity={0.05} />

          {/* Area fill */}
          <path d={areaPath} fill="url(#rssiGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, i) => (
            <circle
              key={i}
              cx={`${scaleX(i)}%`}
              cy={scaleY(point.rssi)}
              r="1.5"
              fill={getRssiColor(point.rssi)}
              className="transition-all hover:r-3"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        {showLabels && data.length > 1 && (
          <div className="flex justify-between text-[10px] text-text-muted mt-1">
            <span>{formatTime(data[0].timestamp)}</span>
            <span>{formatTime(data[Math.floor(data.length / 2)].timestamp)}</span>
            <span>{formatTime(data[data.length - 1].timestamp)}</span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className={cn("flex items-center justify-between mt-2 text-[10px]", showLabels && "ml-10")}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-text-muted">强 ({stats.max}dBm)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-text-muted">中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-danger" />
            <span className="text-text-muted">弱 ({stats.min}dBm)</span>
          </div>
        </div>
        <span className="font-mono text-accent">平均: {stats.avg}dBm</span>
      </div>
    </div>
  );
}

// Format timestamp to HH:MM:SS
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Mini chart for inline display
export interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function MiniChart({ data, height = 24, className }: MiniChartProps) {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = ((max - value) / range) * height;
      return `${x}% ${y}`;
    })
    .join(" L ");

  const areaPath = `M 0% ${height} L ${points} L 100% ${height} Z`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id="miniGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#miniGradient)" />
      <path
        d={`M ${points}`}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
