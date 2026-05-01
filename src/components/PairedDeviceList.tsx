import {
  Smartphone,
  Watch,
  Activity,
  Headphones,
  Speaker,
  Keyboard,
  Mouse,
  HelpCircle,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { PairedDevice, DeviceType } from "../types/bluetooth";
import { cn } from "../lib/utils";

const deviceIcons: Record<DeviceType, typeof Smartphone> = {
  phone: Smartphone,
  watch: Watch,
  band: Activity,
  headphones: Headphones,
  speaker: Speaker,
  keyboard: Keyboard,
  mouse: Mouse,
  other: HelpCircle,
};

const deviceTypeNames: Record<DeviceType, string> = {
  phone: "手机",
  watch: "手表",
  band: "手环",
  headphones: "耳机",
  speaker: "音箱",
  keyboard: "键盘",
  mouse: "鼠标",
  other: "其他",
};

interface PairedDeviceCardProps {
  device: PairedDevice;
  onUnpair: (deviceId: string) => void;
  onToggleEnabled: (device: PairedDevice) => void;
  onConfigure: (device: PairedDevice) => void;
}

export function PairedDeviceCard({
  device,
  onUnpair,
  onToggleEnabled,
  onConfigure,
}: PairedDeviceCardProps) {
  const Icon = deviceIcons[device.device_type];

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
        device.enabled
          ? "bg-surface border-border hover:bg-surface-hover"
          : "bg-surface/50 border-border/50 opacity-60"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
          device.enabled ? "bg-primary/20" : "bg-surface-hover"
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6",
            device.enabled ? "text-primary" : "text-text-muted"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-text font-medium truncate">{device.name}</h4>
          {device.enabled ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-text-muted" />
          )}
        </div>
        <p className="text-text-muted text-sm">
          {deviceTypeNames[device.device_type]}
          <span className="mx-2">•</span>
          解锁范围: {device.unlock_range}m
          <span className="mx-2">•</span>
          锁定范围: {device.lock_range}m
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleEnabled(device)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            device.enabled
              ? "bg-warning/20 text-warning hover:bg-warning/30"
              : "bg-success/20 text-success hover:bg-success/30"
          )}
        >
          {device.enabled ? "禁用" : "启用"}
        </button>
        <button
          onClick={() => onConfigure(device)}
          className="p-2 text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={() => onUnpair(device.id)}
          className="p-2 text-danger hover:bg-danger/10 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface PairedDeviceListProps {
  devices: PairedDevice[];
  onUnpair: (deviceId: string) => void;
  onToggleEnabled: (device: PairedDevice) => void;
  onConfigure: (device: PairedDevice) => void;
}

export function PairedDeviceList({
  devices,
  onUnpair,
  onToggleEnabled,
  onConfigure,
}: PairedDeviceListProps) {
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <HelpCircle className="w-12 h-12 mb-3 opacity-50" />
        <p>暂无已配对设备</p>
        <p className="text-sm mt-1">扫描并添加设备以启用自动解锁</p>
      </div>
    );
  }

  // Sort by priority (higher first)
  const sortedDevices = [...devices].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-3">
      {sortedDevices.map((device) => (
        <PairedDeviceCard
          key={device.id}
          device={device}
          onUnpair={onUnpair}
          onToggleEnabled={onToggleEnabled}
          onConfigure={onConfigure}
        />
      ))}
    </div>
  );
}
