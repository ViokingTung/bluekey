import { useMemo } from "react";
import { cn } from "../../lib/utils";
import { SignalBars } from "./SignalBars";
import type { PairedDevice } from "../../types/bluetooth";

export interface DeviceComparisonProps {
  devices: PairedDevice[];
  signals: Map<string, number>;
  className?: string;
}

export function DeviceComparison({ devices, signals, className }: DeviceComparisonProps) {
  // Sort devices by signal strength
  const sortedDevices = useMemo(() => {
    return [...devices]
      .filter((d) => d.enabled)
      .sort((a, b) => {
        const signalA = signals.get(a.id) ?? -100;
        const signalB = signals.get(b.id) ?? -100;
        return signalB - signalA;
      });
  }, [devices, signals]);

  // Calculate statistics
  const stats = useMemo(() => {
    const values = Array.from(signals.values());
    if (values.length === 0) return { avg: -60, min: -100, max: -30 };
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [signals]);

  if (sortedDevices.length === 0) {
    return (
      <div className={cn("p-4 text-center text-text-muted text-sm", className)}>
        无已启用设备可对比
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">设备信号对比</span>
        <span className="text-[10px] text-text-muted">
          平均 {stats.avg}dBm
        </span>
      </div>

      {/* Comparison bars */}
      <div className="space-y-2">
        {sortedDevices.map((device, index) => {
          const rssi = signals.get(device.id) ?? -100;
          const percentage = ((rssi + 100) / 70) * 100;

          return (
            <div key={device.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted w-4">{index + 1}</span>
                  <span className="text-xs font-medium truncate max-w-[100px]">{device.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SignalBars rssi={rssi} size="sm" />
                  <span className="text-xs font-mono w-12 text-right">{rssi}dBm</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-surface/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    rssi >= -50 ? "bg-success" : rssi >= -70 ? "bg-warning" : "bg-danger"
                  )}
                  style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }}
                />

                {/* Range markers */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-success/50"
                  style={{ left: `${((device.unlock_range / 15) * 100)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-warning/50"
                  style={{ left: `${((device.lock_range / 15) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-text-muted pt-2 border-t border-border-soft">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>强 ({stats.max}dBm)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-danger" />
            <span>弱 ({stats.min}dBm)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Radar-style comparison view
export interface RadarComparisonProps {
  devices: PairedDevice[];
  signals: Map<string, number>;
  distances: Map<string, number>;
  className?: string;
}

export function RadarComparison({
  devices,
  signals,
  distances,
  className,
}: RadarComparisonProps) {
  const size = 200;
  const center = size / 2;
  const maxRadius = center - 20;

  // Get device position on radar
  const getDevicePosition = (device: PairedDevice) => {
    const distance = distances.get(device.id) ?? 10;
    const angle = (devices.indexOf(device) / devices.length) * 360 - 90;
    const radius = Math.min(distance / 15, 1) * maxRadius;

    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
      distance,
      angle,
    };
  };

  // Get color based on signal
  const getSignalColor = (deviceId: string) => {
    const rssi = signals.get(deviceId) ?? -100;
    if (rssi >= -50) return "var(--color-success)";
    if (rssi >= -70) return "var(--color-warning)";
    return "var(--color-danger)";
  };

  const enabledDevices = devices.filter((d) => d.enabled);

  return (
    <div className={cn("relative", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <circle cx={center} cy={center} r={maxRadius} fill="var(--color-surface)" />

        {/* Range rings */}
        {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={maxRadius * ratio}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray={ratio === 1 ? "none" : "2 2"}
          />
        ))}

        {/* Cross lines */}
        <line x1={center} y1={20} x2={center} y2={size - 20} stroke="var(--color-border)" strokeWidth="0.5" />
        <line x1={20} y1={center} x2={size - 20} y2={center} stroke="var(--color-border)" strokeWidth="0.5" />

        {/* Distance labels */}
        <text x={center} y={center - maxRadius * 0.25} textAnchor="middle" className="text-[8px] fill-text-muted">3.75m</text>
        <text x={center} y={center - maxRadius * 0.5} textAnchor="middle" className="text-[8px] fill-text-muted">7.5m</text>
        <text x={center} y={center - maxRadius * 0.75} textAnchor="middle" className="text-[8px] fill-text-muted">11.25m</text>

        {/* Device points */}
        {enabledDevices.map((device) => {
          const pos = getDevicePosition(device);
          const color = getSignalColor(device.id);
          const rssi = signals.get(device.id) ?? -100;

          return (
            <g key={device.id}>
              {/* Glow */}
              <circle cx={pos.x} cy={pos.y} r={12} fill={color} opacity={0.2} />
              {/* Point */}
              <circle cx={pos.x} cy={pos.y} r={6} fill={color} />
              {/* Center */}
              <circle cx={pos.x} cy={pos.y} r={2} fill="var(--color-background)" />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y - 12}
                textAnchor="middle"
                className="text-[8px] fill-text"
              >
                {device.name.slice(0, 6)}
              </text>
              <text
                x={pos.x}
                y={pos.y + 16}
                textAnchor="middle"
                className="text-[7px] fill-text-muted"
              >
                {rssi}dBm · {pos.distance.toFixed(1)}m
              </text>
            </g>
          );
        })}

        {/* Center point */}
        <circle cx={center} cy={center} r={4} fill="var(--color-accent)" />
        <circle cx={center} cy={center} r={2} fill="var(--color-background)" />
      </svg>

      {/* Legend */}
      <div className="absolute bottom-0 right-0 flex flex-col gap-1 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-text-muted">强信号</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-text-muted">中等</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-text-muted">弱信号</span>
        </div>
      </div>
    </div>
  );
}
