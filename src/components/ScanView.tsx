import { X, Search, StopCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { RadarViz } from "./ui/RadarViz";
import { SignalInline } from "./ui/SignalBars";
import { useTranslation } from "../lib/i18n";
import type { BluetoothDevice, PairedDevice } from "../types/bluetooth";

export interface ScanViewProps {
  isOpen: boolean;
  isScanning: boolean;
  devices: BluetoothDevice[];
  pairedDevices: PairedDevice[];
  onStartScan: () => void;
  onStopScan: () => void;
  onAddDevice: (device: BluetoothDevice) => void;
  onClose: () => void;
}

// Get device icon based on type
function getDeviceIcon(type: string) {
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
}

export function ScanView({
  isOpen,
  isScanning,
  devices,
  pairedDevices,
  onStartScan,
  onStopScan,
  onAddDevice,
  onClose,
}: ScanViewProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Filter out already paired devices
  const unpairedDevices = devices.filter(
    (d) => !pairedDevices.some((p) => p.id === d.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft">
          <h2 className="font-display font-semibold text-sm">{t("scan.title")}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Radar Visualization */}
          <div className="flex justify-center mb-4">
            <RadarViz active={isScanning} size={140} />
          </div>

          {/* Scan Controls */}
          <div className="flex justify-center gap-3 mb-4">
            {!isScanning ? (
              <Button onClick={onStartScan} className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                {t("devices.scan")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={onStopScan}
                className="flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                {t("scan.stopScan")}
              </Button>
            )}
          </div>

          {/* Status */}
          {isScanning && (
            <div className="text-center text-xs text-text-muted mb-4">
              {t("scan.scanning")}
            </div>
          )}

          {/* Device List */}
          <div className="max-h-64 overflow-auto space-y-2">
            {unpairedDevices.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                {isScanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span>{t("devices.scanning")}</span>
                  </div>
                ) : (
                  <span>{t("scan.noDevices")}</span>
                )}
              </div>
            ) : (
              unpairedDevices.map((device) => (
                <DeviceScanRow
                  key={device.id}
                  device={device}
                  onAdd={() => onAddDevice(device)}
                  t={t}
                />
              ))
            )}
          </div>

          {/* Device count */}
          {unpairedDevices.length > 0 && (
            <div className="mt-3 text-center text-xs text-text-muted">
              {t("scan.found", { count: unpairedDevices.length })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Device row in scan list
interface DeviceScanRowProps {
  device: BluetoothDevice;
  onAdd: () => void;
  t: (key: string) => string;
}

function DeviceScanRow({ device, onAdd, t }: DeviceScanRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-surface/30 hover:bg-surface-hover transition-colors cursor-pointer"
      )}
      onClick={onAdd}
    >
      {/* Device icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base bg-surface-hover">
        {getDeviceIcon(device.device_type)}
      </div>

      {/* Device info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{device.name || t("scan.noDevices")}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-muted">{device.device_type}</span>
          {device.rssi && <SignalInline rssi={device.rssi} />}
        </div>
      </div>

      {/* Add button */}
      <div className="text-accent text-xs font-medium">{t("scan.add")}</div>
    </div>
  );
}
