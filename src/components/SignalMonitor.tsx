import { useState, useEffect } from "react";
import { Activity, Wifi, WifiOff, BarChart3, Radar } from "lucide-react";
import { cn } from "../lib/utils";
import { SignalBars } from "./ui/SignalBars";
import { SignalWaveform } from "./ui/SignalWaveform";
import { DeviceComparison, RadarComparison } from "./ui/DeviceComparison";
import type { PairedDevice, ProximityStatus } from "../types/bluetooth";

export interface SignalMonitorProps {
  devices: PairedDevice[];
  active?: boolean;
  viewMode?: "cards" | "waveform" | "comparison" | "radar";
  className?: string;
}

interface DeviceSignal {
  deviceId: string;
  name: string;
  rssi: number;
  distance: number;
  status: ProximityStatus;
  lastUpdate: number;
}

export function SignalMonitor({ devices, active = false, viewMode = "cards", className }: SignalMonitorProps) {
  const [signals, setSignals] = useState<DeviceSignal[]>([]);
  const [history, setHistory] = useState<Map<string, number[]>>(new Map());
  const [currentView, setCurrentView] = useState(viewMode);

  // Simulate signal updates
  useEffect(() => {
    if (!active) return;

    const updateSignals = () => {
      setSignals(() => {
        const newSignals = devices.map((device) => {
          const baseRssi = device.calibration?.rssi_1m ?? -60;

          // Simulate RSSI with some variation
          const rssi = baseRssi + Math.floor(Math.random() * 30 - 15);

          // Calculate distance from RSSI
          const distance = calculateDistance(rssi, baseRssi);

          // Determine status
          let status: ProximityStatus = "OutOfRange";
          if (distance <= device.unlock_range) {
            status = "InRange";
          } else if (distance <= device.lock_range) {
            status = "NearRange";
          }

          return {
            deviceId: device.id,
            name: device.name,
            rssi,
            distance,
            status,
            lastUpdate: Date.now(),
          };
        });

        return newSignals;
      });
    };

    // Initial update
    updateSignals();

    // Update every 500ms
    const interval = setInterval(updateSignals, 500);
    return () => clearInterval(interval);
  }, [devices, active]);

  // Update history for charts
  useEffect(() => {
    if (!active || signals.length === 0) return;

    setHistory((prev) => {
      const newHistory = new Map(prev);
      signals.forEach((signal) => {
        const existing = newHistory.get(signal.deviceId) ?? [];
        // Keep last 60 samples (30 seconds at 500ms intervals)
        const updated = [...existing, signal.rssi].slice(-60);
        newHistory.set(signal.deviceId, updated);
      });
      return newHistory;
    });
  }, [signals, active]);

  const activeDevices = signals.filter((s) => {
    const device = devices.find((d) => d.id === s.deviceId);
    return device?.enabled;
  });

  if (!active) {
    return (
      <div className={cn("p-4 rounded-lg bg-surface/30 text-center", className)}>
        <WifiOff className="w-6 h-6 mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-muted">监控未启动</p>
      </div>
    );
  }

  // Build signals map for comparison views
  const signalsMap = new Map(signals.map((s) => [s.deviceId, s.rssi]));
  const distancesMap = new Map(signals.map((s) => [s.deviceId, s.distance]));

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Activity className="w-4 h-4 text-accent animate-pulse" />
        <span className="text-xs font-medium">实时信号监控</span>
        <div className="flex-1" />
        <span className="text-[10px] text-text-muted">{activeDevices.length} 设备在线</span>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-surface/30 rounded-lg">
        <button
          onClick={() => setCurrentView("cards")}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-medium rounded transition-colors",
            currentView === "cards" ? "bg-accent text-white" : "text-text-muted hover:bg-surface-hover"
          )}
        >
          卡片
        </button>
        <button
          onClick={() => setCurrentView("waveform")}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-medium rounded transition-colors flex items-center justify-center gap-1",
            currentView === "waveform" ? "bg-accent text-white" : "text-text-muted hover:bg-surface-hover"
          )}
        >
          <BarChart3 className="w-3 h-3" />
          波形
        </button>
        <button
          onClick={() => setCurrentView("comparison")}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-medium rounded transition-colors",
            currentView === "comparison" ? "bg-accent text-white" : "text-text-muted hover:bg-surface-hover"
          )}
        >
          对比
        </button>
        <button
          onClick={() => setCurrentView("radar")}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-medium rounded transition-colors flex items-center justify-center gap-1",
            currentView === "radar" ? "bg-accent text-white" : "text-text-muted hover:bg-surface-hover"
          )}
        >
          <Radar className="w-3 h-3" />
          雷达
        </button>
      </div>

      {/* Content based on view */}
      {currentView === "cards" && (
        <div className="space-y-2">
          {activeDevices.map((signal) => (
            <SignalCard
              key={signal.deviceId}
              signal={signal}
              history={history.get(signal.deviceId) ?? []}
            />
          ))}
        </div>
      )}

      {currentView === "waveform" && activeDevices.length > 0 && (
        <div className="space-y-3">
          {activeDevices.map((signal) => (
            <div key={signal.deviceId} className="p-3 rounded-lg bg-surface/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">{signal.name}</span>
                <span className="text-[10px] text-text-muted">{signal.distance.toFixed(1)}m</span>
              </div>
              <SignalWaveform
                rssi={signal.rssi}
                history={history.get(signal.deviceId) ?? []}
                height={40}
                animated
              />
            </div>
          ))}
        </div>
      )}

      {currentView === "comparison" && (
        <div className="p-3 rounded-lg bg-surface/30">
          <DeviceComparison devices={devices} signals={signalsMap} />
        </div>
      )}

      {currentView === "radar" && (
        <div className="flex justify-center p-3 rounded-lg bg-surface/30">
          <RadarComparison
            devices={devices}
            signals={signalsMap}
            distances={distancesMap}
          />
        </div>
      )}

      {activeDevices.length === 0 && (
        <div className="p-4 rounded-lg bg-surface/30 text-center">
          <Wifi className="w-6 h-6 mx-auto mb-2 text-text-muted" />
          <p className="text-sm text-text-muted">无已启用设备</p>
        </div>
      )}
    </div>
  );
}

// Individual signal card
interface SignalCardProps {
  signal: DeviceSignal;
  history: number[];
}

function SignalCard({ signal, history }: SignalCardProps) {
  const statusColor = {
    InRange: "text-success",
    NearRange: "text-warning",
    OutOfRange: "text-text-muted",
    Unknown: "text-text-muted",
  };

  const statusBg = {
    InRange: "bg-success/10 border-success/30",
    NearRange: "bg-warning/10 border-warning/30",
    OutOfRange: "bg-surface/30 border-border-soft",
    Unknown: "bg-surface/30 border-border-soft",
  };

  const statusText = {
    InRange: "在范围内",
    NearRange: "接近边界",
    OutOfRange: "超出范围",
    Unknown: "未知",
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-300",
        statusBg[signal.status]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{signal.name}</span>
          <span className={cn("text-xs", statusColor[signal.status])}>
            {statusText[signal.status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SignalBars rssi={signal.rssi} size="sm" animated />
          <span className="font-mono text-xs">{signal.rssi}dBm</span>
        </div>
      </div>

      {/* Distance */}
      <div className="flex items-center justify-between text-xs text-text-muted mb-2">
        <span>距离</span>
        <span className="font-mono">{signal.distance.toFixed(1)}m</span>
      </div>

      {/* Mini chart */}
      {history.length > 1 && (
        <div className="h-8 flex items-end gap-[1px]">
          {history.map((rssi, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-[1px] transition-all",
                rssi >= -50 ? "bg-success/60" : rssi >= -70 ? "bg-warning/60" : "bg-danger/60"
              )}
              style={{
                height: `${Math.min(100, Math.max(10, (rssi + 100) * 1.2))}%`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Calculate distance from RSSI using path loss model
function calculateDistance(rssi: number, rssi1m: number): number {
  const pathLossExponent = 2.0;
  const distance = Math.pow(10, (rssi1m - rssi) / (10 * pathLossExponent));
  return Math.max(0.1, Math.min(20, distance));
}
