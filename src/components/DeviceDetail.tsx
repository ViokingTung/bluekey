import { useState, useEffect } from "react";
import { X, Trash2, Settings, Sliders, Ruler } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { SignalBars } from "./ui/SignalBars";
import { DistanceRing } from "./ui/RadarViz";
import { CalibrationFlow } from "./CalibrationFlow";
import { ConfigModal } from "./ConfigModal";
import { useTranslation } from "../lib/i18n";
import { getDevices } from "../api/bluetooth";
import type { PairedDevice, CalibrationData } from "../types/bluetooth";

export interface DeviceDetailProps {
  device: PairedDevice;
  onClose: () => void;
  onToggleEnabled: (device: PairedDevice) => void;
  onUnpair: (deviceId: string) => void;
  onCalibrate: (device: PairedDevice, calibration: CalibrationData) => void;
  onUpdateDevice: (device: PairedDevice, updates: Partial<PairedDevice>) => void;
}

export function DeviceDetail({
  device,
  onClose,
  onUnpair,
  onCalibrate,
  onUpdateDevice,
}: DeviceDetailProps) {
  const { t } = useTranslation();
  const [showCalibration, setShowCalibration] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Real RSSI tracking
  const [rssiHistory, setRssiHistory] = useState<number[]>([]);
  const [currentDistance, setCurrentDistance] = useState<number>(0);

  useEffect(() => {
    // Poll the current device's RSSI from get_devices
    const interval = setInterval(async () => {
      try {
        const devicesList = await getDevices();
        const currentDevice = devicesList.find((d) => d.id === device.id);
        if (currentDevice) {
          if (currentDevice.rssi) {
            setRssiHistory((prev) => {
              const next = [...prev, currentDevice.rssi as number];
              return next.slice(-20); // Keep last 20 readings
            });
          }
          if (currentDevice.distance !== undefined && currentDevice.distance !== null) {
            setCurrentDistance(currentDevice.distance);
          }
        }
      } catch (e) {
        // ignore errors during polling
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [device.id]);

  const currentRssi = rssiHistory.length > 0 ? rssiHistory[rssiHistory.length - 1] : -100;
  const avgRssi = rssiHistory.length > 0 
    ? Math.round(rssiHistory.reduce((a, b) => a + b, 0) / rssiHistory.length) 
    : -100;

  // Get device icon based on type
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "phone":
        return "📱";
      case "watch":
      case "band":
        return "⌚";
      case "headphones":
        return "🎧";
      case "speaker":
        return "🔊";
      case "keyboard":
        return "⌨️";
      case "mouse":
        return "🖱️";
      default:
        return "📱";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                device.enabled ? "bg-accent/20" : "bg-surface-hover"
              )}
            >
              {getDeviceIcon(device.device_type)}
            </div>
            <div>
              <h2 className="font-display font-semibold text-sm">{device.name}</h2>
              <p className="text-xs text-text-muted">{device.device_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status & Signal */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <SignalBars rssi={currentRssi} size="sm" />
              <span className="text-xs font-mono text-text-soft">{currentRssi}dBm</span>
            </div>
          </div>

          {/* Distance Visualization */}
          <div className="flex items-center justify-center py-4">
            <DistanceRing distance={currentDistance} maxDistance={device.unlock_range} size={100} />
          </div>

          {/* Range Settings */}
          <Card className="bg-surface/30 border-border-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Sliders className="w-3 h-3 text-accent" />
                {t("device.unlockRange")} / {t("device.lockRange")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs">
                <div>
                  <span className="text-text-muted">{t("device.unlockRange")}</span>
                  <span className="ml-2 font-mono text-accent">{device.unlock_range}{t("common.meters")}</span>
                </div>
                <div>
                  <span className="text-text-muted">{t("device.lockRange")}</span>
                  <span className="ml-2 font-mono text-warning">{device.lock_range}{t("common.meters")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSSI History Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{t("deviceDetail.signalHistory")}</span>
              <span className="text-[10px] font-mono text-text-muted">avg: {avgRssi}dBm</span>
            </div>
            <div className="h-16 flex items-end gap-[2px] bg-surface/30 rounded-lg p-2">
              {rssiHistory.map((rssi, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-[1px] transition-all",
                    rssi >= -50 ? "bg-success" : rssi >= -70 ? "bg-warning" : "bg-danger"
                  )}
                  style={{
                    height: `${Math.min(100, Math.max(10, (rssi + 100) * 1.2))}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Calibration Info */}
          {device.calibration && (
            <div className="text-xs text-text-muted bg-surface/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span>{t("deviceDetail.calibrationInfo")}</span>
                <span className="font-mono">{device.calibration.samples} samples</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span>RSSI@1m</span>
                <span className="font-mono">{device.calibration.rssi_1m}dBm</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalibration(true)}
            >
              <Ruler className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="w-3 h-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onUnpair(device.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calibration Flow */}
      {showCalibration && (
        <CalibrationFlow
          device={device}
          onClose={() => setShowCalibration(false)}
          onComplete={(dev, calibration) => {
            onCalibrate(dev, calibration);
            setShowCalibration(false);
          }}
        />
      )}

      {/* Config Modal */}
      {showConfig && (
        <ConfigModal
          device={device}
          onClose={() => setShowConfig(false)}
          onSave={(dev, updates) => {
            onUpdateDevice(dev, updates);
            setShowConfig(false);
          }}
          onCalibrate={() => {
            setShowConfig(false);
            setShowCalibration(true);
          }}
        />
      )}
    </div>
  );
}
