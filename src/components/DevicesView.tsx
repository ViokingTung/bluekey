import { Shield, ShieldOff, Lock, Link2, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { PillBtn } from "./ui/PillBtn";
import { useTranslation } from "../lib/i18n";
import type { PairedDevice } from "../types/bluetooth";

export interface DevicesViewProps {
  pairedDevices: PairedDevice[];
  monitoring: boolean;
  onAddDevice: () => void;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  onLockScreen: () => void;
  onToggleEnabled: (device: PairedDevice) => void;
  onSelectDevice: (device: PairedDevice) => void;
}

export function DevicesView({
  pairedDevices,
  monitoring,
  onAddDevice,
  onStartMonitoring,
  onStopMonitoring,
  onLockScreen,
  onToggleEnabled,
  onSelectDevice,
}: DevicesViewProps) {
  const { t } = useTranslation();
  const enabledCount = pairedDevices.filter((d) => d.enabled).length;

  return (
    <div className="p-4 space-y-4 overflow-auto">
      {/* Monitor Status Card */}
      <Card className="glass border-border-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-accent" />
            {t("devices.monitoring")}
          </CardTitle>
          <CardDescription>
            {t("app.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {!monitoring ? (
              <Button
                onClick={onStartMonitoring}
                className="flex items-center gap-2"
                disabled={enabledCount === 0}
              >
                <Shield className="w-4 h-4" />
                {t("devices.startMonitoring")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={onStopMonitoring}
                className="flex items-center gap-2"
              >
                <ShieldOff className="w-4 h-4" />
                {t("devices.stopMonitoring")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onLockScreen}
              className="flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {t("devices.lockScreen")}
            </Button>
          </div>

          {monitoring && (
            <div className="mt-4 flex items-center gap-2 text-success">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm">{t("devices.monitoring")} - {enabledCount} {t("device.enabled")}</span>
            </div>
          )}

          {enabledCount === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 text-warning text-sm">
              {t("devices.noDevicesHint")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paired Devices Card */}
      <Card className="glass border-border-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="w-4 h-4 text-accent" />
                {t("devices.paired")}
              </CardTitle>
              <CardDescription>
                {t("devices.noDevicesHint")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {pairedDevices.length > 0 && (
                <span className="text-xs text-success">
                  {enabledCount} {t("device.enabled")}
                </span>
              )}
              <PillBtn onClick={onAddDevice}>
                <Plus className="w-3 h-3" />
                {t("devices.add")}
              </PillBtn>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pairedDevices.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">
              <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{t("devices.noDevices")}</p>
              <p className="text-xs mt-1">{t("devices.noDevicesHint")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pairedDevices.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  onToggle={() => onToggleEnabled(device)}
                  onSelect={() => onSelectDevice(device)}
                  lang={t("app.name") === "BlueKey" ? "en-US" : "zh-CN"}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Individual device row component
interface DeviceRowProps {
  device: PairedDevice;
  onToggle: () => void;
  onSelect: () => void;
  lang: "zh-CN" | "en-US";
}

function DeviceRow({ device, onToggle, onSelect, lang }: DeviceRowProps) {
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
        return "�️";
      default:
        return "📱";
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150",
        "hover:bg-surface-hover active:scale-[0.99]",
        device.enabled && "bg-accent/5 border border-accent/20"
      )}
    >
      {/* Device icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
          device.enabled ? "bg-accent/20" : "bg-surface-hover"
        )}
      >
        {getDeviceIcon(device.device_type)}
      </div>

      {/* Device info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{device.name}</span>
          {device.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-muted">{device.device_type}</span>
          {device.last_seen && (
            <span className="text-[10px] text-text-muted">
              {formatLastSeen(device.last_seen, lang)}
            </span>
          )}
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors duration-200",
          device.enabled ? "bg-accent" : "bg-surface-hover"
        )}
      >
        <div
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
            device.enabled ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

// Format last seen timestamp
function formatLastSeen(timestamp: number, lang: "zh-CN" | "en-US"): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (lang === "zh-CN") {
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
}
