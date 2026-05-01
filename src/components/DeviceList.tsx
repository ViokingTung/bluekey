import {
  Smartphone,
  Watch,
  Activity,
  Headphones,
  Speaker,
  Keyboard,
  Mouse,
  HelpCircle,
  Signal,
} from "lucide-react";
import type { BluetoothDevice, DeviceType } from "../types/bluetooth";
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

interface DeviceCardProps {
  device: BluetoothDevice;
  onAdd?: (device: BluetoothDevice) => void;
}

export function DeviceCard({ device, onAdd }: DeviceCardProps) {
  const Icon = deviceIcons[device.device_type];
  const signalStrength = device.rssi
    ? Math.min(100, Math.max(0, (device.rssi + 100) * 2))
    : 0;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border hover:bg-surface-hover transition-colors">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-text font-medium truncate">{device.name}</h4>
        <p className="text-text-muted text-sm">
          {deviceTypeNames[device.device_type]}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {device.rssi && (
          <div className="flex items-center gap-1.5">
            <Signal
              className={cn(
                "w-4 h-4",
                signalStrength > 60
                  ? "text-success"
                  : signalStrength > 30
                  ? "text-warning"
                  : "text-danger"
              )}
            />
            <span className="text-xs text-text-muted">
              {device.distance?.toFixed(1)}m
            </span>
          </div>
        )}

        {onAdd && (
          <button
            onClick={() => onAdd(device)}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            添加
          </button>
        )}
      </div>
    </div>
  );
}

interface DeviceListProps {
  devices: BluetoothDevice[];
  onAdd?: (device: BluetoothDevice) => void;
  emptyMessage?: string;
}

export function DeviceList({
  devices,
  onAdd,
  emptyMessage = "未发现设备",
}: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <HelpCircle className="w-12 h-12 mb-3 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} onAdd={onAdd} />
      ))}
    </div>
  );
}
