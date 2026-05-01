import { useState, useEffect } from "react";
import { History, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { getAuditLog, clearAuditLog } from "../api/bluetooth";
import { useTranslation, getLanguage } from "../lib/i18n";
import type { AuditLogEntry, AuditEventType } from "../types/bluetooth";

const eventLabelsZh: Record<AuditEventType, string> = {
  DevicePaired: "设备配对",
  DeviceUnpaired: "设备移除",
  DeviceEnabled: "设备启用",
  DeviceDisabled: "设备禁用",
  MonitoringStarted: "监控启动",
  MonitoringStopped: "监控停止",
  AutoLockTriggered: "自动锁定",
  AutoUnlockTriggered: "自动解锁",
  ManualLock: "手动锁定",
  DeviceVerified: "设备验证成功",
  VerificationFailed: "验证失败",
  SettingsChanged: "设置更改",
};

const eventLabelsEn: Record<AuditEventType, string> = {
  DevicePaired: "Device Paired",
  DeviceUnpaired: "Device Removed",
  DeviceEnabled: "Device Enabled",
  DeviceDisabled: "Device Disabled",
  MonitoringStarted: "Monitoring Started",
  MonitoringStopped: "Monitoring Stopped",
  AutoLockTriggered: "Auto Lock",
  AutoUnlockTriggered: "Auto Unlock",
  ManualLock: "Manual Lock",
  DeviceVerified: "Device Verified",
  VerificationFailed: "Verification Failed",
  SettingsChanged: "Settings Changed",
};

export function AuditLogPanel() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const eventLabels = getLanguage() === "zh-CN" ? eventLabelsZh : eventLabelsEn;

  useEffect(() => {
    loadLog();
  }, []);

  const loadLog = async () => {
    setLoading(true);
    try {
      const log = await getAuditLog();
      setEntries(log.reverse()); // Show newest first
    } catch (e) {
      console.error("Failed to load audit log:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAuditLog();
      setEntries([]);
      setShowConfirm(false);
    } catch (e) {
      console.error("Failed to clear audit log:", e);
    } finally {
      setClearing(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(getLanguage() === "zh-CN" ? "zh-CN" : "en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {t("activity.title")}
            </CardTitle>
            <CardDescription>
              {getLanguage() === "zh-CN" ? "记录所有设备操作和安全事件" : "Record all device operations and security events"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadLog}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
              title={t("scan.rescan")}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={clearing || entries.length === 0}
                className="p-2 rounded-lg hover:bg-danger/10 text-danger transition-colors disabled:opacity-50"
                title={t("activity.clear")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="px-2 py-1 text-xs rounded-md bg-danger text-white hover:bg-danger/90 disabled:opacity-50 transition-colors"
                >
                  {getLanguage() === "zh-CN" ? "确认" : "Confirm"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={clearing}
                  className="px-2 py-1 text-xs rounded-md bg-surface hover:bg-surface-hover text-text-muted disabled:opacity-50 transition-colors"
                >
                  {getLanguage() === "zh-CN" ? "取消" : "Cancel"}
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-text-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            {t("common.loading")}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            {t("activity.noLogs")}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover/50"
              >
                <div className={`mt-0.5 ${entry.success ? "text-success" : "text-danger"}`}>
                  {entry.success ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-text font-medium text-sm">
                      {eventLabels[entry.event_type] || entry.event_type}
                    </span>
                    {entry.device_name && (
                      <span className="text-primary text-xs">
                        {entry.device_name}
                      </span>
                    )}
                  </div>
                  {entry.details && (
                    <p className="text-text-muted text-xs mt-0.5 truncate">
                      {entry.details}
                    </p>
                  )}
                </div>
                <span className="text-text-muted text-xs whitespace-nowrap">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
