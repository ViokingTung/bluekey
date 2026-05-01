import { useMemo } from "react";
import { cn } from "../../lib/utils";

export interface SignalHeatmapProps {
  data: HeatmapCell[][];
  timeLabels?: string[];
  distanceLabels?: string[];
  colorScale?: "rssi" | "status" | "custom";
  customColors?: { min: string; mid: string; max: string };
  showLegend?: boolean;
  className?: string;
}

export interface HeatmapCell {
  value: number;
  status?: "InRange" | "NearRange" | "OutOfRange";
  timestamp?: number;
}

export function SignalHeatmap({
  data,
  timeLabels,
  distanceLabels,
  colorScale = "rssi",
  showLegend = true,
  className,
}: SignalHeatmapProps) {
  // Calculate value range
  const { min, max } = useMemo(() => {
    const values = data.flat().map((c) => c.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data]);

  // Get cell color
  const getCellColor = (cell: HeatmapCell) => {
    if (colorScale === "status" && cell.status) {
      switch (cell.status) {
        case "InRange":
          return "bg-success";
        case "NearRange":
          return "bg-warning";
        case "OutOfRange":
          return "bg-danger";
      }
    }

    // RSSI color scale
    const ratio = (cell.value - min) / (max - min || 1);
    if (ratio >= 0.7) return "bg-success";
    if (ratio >= 0.4) return "bg-warning";
    return "bg-danger";
  };

  // Get cell opacity based on value
  const getCellOpacity = (cell: HeatmapCell) => {
    const ratio = (cell.value - min) / (max - min || 1);
    return 0.3 + ratio * 0.7;
  };

  if (data.length === 0 || data[0].length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-surface/30 rounded-lg h-32", className)}>
        <span className="text-xs text-text-muted">暂无热力图数据</span>
      </div>
    );
  }

  const rows = data.length;
  const cols = data[0].length;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Heatmap grid */}
      <div className="flex">
        {/* Distance labels (Y-axis) */}
        {distanceLabels && (
          <div className="flex flex-col justify-between pr-2 text-[10px] text-text-muted">
            {distanceLabels.map((label, i) => (
              <span key={i} className="h-4 leading-4">
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Heatmap */}
        <div className="flex-1 overflow-hidden rounded-lg">
          <div
            className="grid gap-[1px] bg-border-soft p-[1px]"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {data.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "aspect-square transition-all duration-300 rounded-[1px]",
                    getCellColor(cell)
                  )}
                  style={{ opacity: getCellOpacity(cell) }}
                  title={`${cell.value}dBm`}
                />
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col justify-between pl-2 text-[10px] text-text-muted">
            <span className="h-4 leading-4 text-success">强</span>
            <span className="h-4 leading-4 text-warning">中</span>
            <span className="h-4 leading-4 text-danger">弱</span>
          </div>
        )}
      </div>

      {/* Time labels (X-axis) */}
      {timeLabels && (
        <div className="flex justify-between text-[10px] text-text-muted px-[distanceLabels ? 28 : 0]">
          {timeLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// Circular heatmap for distance visualization
export interface CircularHeatmapProps {
  rings: number;
  segments: number;
  data: number[];
  maxDistance: number;
  className?: string;
}

export function CircularHeatmap({
  rings,
  segments,
  data,
  maxDistance,
  className,
}: CircularHeatmapProps) {
  const { min, max } = useMemo(() => {
    return {
      min: Math.min(...data),
      max: Math.max(...data),
    };
  }, [data]);

  const getColor = (value: number) => {
    const ratio = (value - min) / (max - min || 1);
    if (ratio >= 0.7) return "var(--color-success)";
    if (ratio >= 0.4) return "var(--color-warning)";
    return "var(--color-danger)";
  };

  const getOpacity = (value: number) => {
    const ratio = (value - min) / (max - min || 1);
    return 0.3 + ratio * 0.7;
  };

  const size = 200;
  const center = size / 2;
  const ringWidth = (center - 20) / rings;

  // Generate arc paths for each segment
  const renderSegment = (ringIndex: number, segmentIndex: number, value: number) => {
    const innerRadius = 20 + ringIndex * ringWidth;
    const outerRadius = innerRadius + ringWidth - 2;
    const startAngle = (segmentIndex / segments) * 360 - 90;
    const endAngle = ((segmentIndex + 1) / segments) * 360 - 90;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + innerRadius * Math.cos(startRad);
    const y1 = center + innerRadius * Math.sin(startRad);
    const x2 = center + outerRadius * Math.cos(startRad);
    const y2 = center + outerRadius * Math.sin(startRad);
    const x3 = center + outerRadius * Math.cos(endRad);
    const y3 = center + outerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(endRad);
    const y4 = center + innerRadius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const path = `
      M ${x1} ${y1}
      L ${x2} ${y2}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}
      L ${x4} ${y4}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
    `;

    return (
      <path
        key={`${ringIndex}-${segmentIndex}`}
        d={path}
        fill={getColor(value)}
        fillOpacity={getOpacity(value)}
        className="transition-all duration-300 hover:fill-opacity-100"
        stroke="var(--color-border)"
        strokeWidth="0.5"
      />
    );
  };

  return (
    <div className={cn("relative", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <circle cx={center} cy={center} r={center - 10} fill="var(--color-surface)" />

        {/* Segments */}
        {data.map((value, i) => {
          const ringIndex = Math.floor(i / segments);
          const segmentIndex = i % segments;
          return renderSegment(ringIndex, segmentIndex, value);
        })}

        {/* Center dot */}
        <circle cx={center} cy={center} r="8" fill="var(--color-accent)" />
        <circle cx={center} cy={center} r="4" fill="var(--color-background)" />

        {/* Distance rings labels */}
        {Array.from({ length: rings }).map((_, i) => {
          const radius = 20 + (i + 0.5) * ringWidth;
          const distance = ((i + 1) / rings) * maxDistance;
          return (
            <text
              key={i}
              x={center}
              y={center - radius}
              textAnchor="middle"
              className="text-[8px] fill-text-muted"
            >
              {distance.toFixed(1)}m
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-0 right-0 flex items-center gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-text-muted">强</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-text-muted">中</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-text-muted">弱</span>
        </div>
      </div>
    </div>
  );
}
