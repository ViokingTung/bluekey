import { useState } from "react";
import { X, Sliders, Ruler, Save } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import type { PairedDevice, DeviceType } from "../types/bluetooth";

import { useTranslation } from "../lib/i18n";

const DEVICE_TYPES: { value: DeviceType; labelKey: string; icon: string }[] = [
  { value: "phone", labelKey: "deviceType.phone", icon: "📱" },
  { value: "watch", labelKey: "deviceType.watch", icon: "⌚" },
  { value: "band", labelKey: "deviceType.band", icon: "⌚" },
  { value: "headphones", labelKey: "deviceType.headphones", icon: "🎧" },
  { value: "speaker", labelKey: "deviceType.speaker", icon: "🔊" },
  { value: "keyboard", labelKey: "deviceType.keyboard", icon: "⌨️" },
  { value: "mouse", labelKey: "deviceType.mouse", icon: "🖱️" },
  { value: "other", labelKey: "deviceType.other", icon: "📱" },
];

export interface ConfigModalProps {
  device: PairedDevice;
  onClose: () => void;
  onSave: (device: PairedDevice, updates: Partial<PairedDevice>) => void;
  onCalibrate: () => void;
}

export function ConfigModal({ device, onClose, onSave, onCalibrate }: ConfigModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(device.name);
  const [deviceType, setDeviceType] = useState<DeviceType>(device.device_type);
  const [unlockRange, setUnlockRange] = useState(device.unlock_range);
  const [lockRange, setLockRange] = useState(device.lock_range);
  const priority = device.priority;

  const handleSave = () => {
    onSave(device, {
      name,
      device_type: deviceType,
      unlock_range: unlockRange,
      lock_range: lockRange,
      priority,
    });
    onClose();
  };

  // Validate ranges
  const rangeError = lockRange <= unlockRange;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <h2 className="font-display font-semibold text-sm">{t("config.title")}</h2>
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
          {/* Device Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted">{t("config.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-surface/50 border border-border-soft",
                "focus:outline-none focus:ring-2 focus:ring-accent/50",
                "transition-all"
              )}
              placeholder={t("config.namePlaceholder")}
            />
          </div>

          {/* Device Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted">{t("config.deviceType")}</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-surface/50 border border-border-soft",
                "focus:outline-none focus:ring-2 focus:ring-accent/50",
                "transition-all appearance-none text-text"
              )}
            >
              {DEVICE_TYPES.map(type => (
                <option key={type.value} value={type.value} className="bg-surface text-text">
                  {type.icon} {t(type.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Range Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <Ruler className="w-3 h-3" />
              {t("config.rangeTitle")}
            </div>

            {/* Unlock Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-muted">{t("config.unlockDistance")}</label>
                <span className="text-xs font-mono text-accent">{unlockRange.toFixed(1)}{t("common.meters")}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={unlockRange}
                onChange={(e) => setUnlockRange(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
              <p className="text-[10px] text-text-muted">
                {t("config.unlockHint")}
              </p>
            </div>

            {/* Lock Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-muted">{t("config.lockDistance")}</label>
                <span className="text-xs font-mono text-warning">{lockRange.toFixed(1)}{t("common.meters")}</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={lockRange}
                onChange={(e) => setLockRange(parseFloat(e.target.value))}
                className="w-full accent-warning"
              />
              {rangeError && (
                <p className="text-[10px] text-danger">
                  {t("config.rangeError")}
                </p>
              )}
              <p className="text-[10px] text-text-muted">
                {t("config.lockHint")}
              </p>
            </div>

            {/* Visual Range Preview */}
            <div className="relative h-12 bg-surface/30 rounded-lg overflow-hidden">
              {/* Distance scale */}
              <div className="absolute inset-0 flex items-center px-2">
                <div className="w-full h-1 bg-border rounded-full relative">
                  {/* Unlock zone */}
                  <div
                    className="absolute left-0 h-full bg-accent/50 rounded-full"
                    style={{ width: `${(unlockRange / 15) * 100}%` }}
                  />
                  {/* Near zone */}
                  <div
                    className="absolute h-full bg-warning/30"
                    style={{
                      left: `${(unlockRange / 15) * 100}%`,
                      width: `${((lockRange - unlockRange) / 15) * 100}%`,
                    }}
                  />
                  {/* Markers */}
                  <div
                    className="absolute w-0.5 h-3 bg-accent -top-1"
                    style={{ left: `${(unlockRange / 15) * 100}%` }}
                  />
                  <div
                    className="absolute w-0.5 h-3 bg-warning -top-1"
                    style={{ left: `${(lockRange / 15) * 100}%` }}
                  />
                </div>
              </div>
              {/* Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[8px] text-text-muted">
                <span>0m</span>
                <span>{unlockRange}m</span>
                <span>{lockRange}m</span>
                <span>15m</span>
              </div>
            </div>
          </div>


          {/* Calibration CTA */}
          {!device.calibration && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">{t("config.improveAccuracy")}</p>
                  <p className="text-[10px] text-text-muted">{t("config.performCalibration")}</p>
                </div>
                <Button size="sm" onClick={onCalibrate}>
                  {t("device.calibrate")}
                </Button>
              </div>
            </div>
          )}

          {/* Calibration Info */}
          {device.calibration && (
            <div className="p-3 rounded-lg bg-surface/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t("config.calibrationBaseline")}</span>
                <span className="font-mono text-accent">
                  {device.calibration.rssi_1m}dBm @ 1m
                </span>
              </div>
              <button
                onClick={onCalibrate}
                className="mt-2 text-[10px] text-accent hover:underline"
              >
                {t("config.recalibrate")}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-border-soft">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={rangeError}>
            <Save className="w-4 h-4 mr-2" />
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
