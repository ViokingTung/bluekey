import { invoke } from "@tauri-apps/api/core";
import type { BluetoothDevice, PairedDevice, AppSettings, CalibrationData, VerificationCode, AuditLogEntry } from "../types/bluetooth";

// ==================== Scanner ====================

export async function scanBluetooth(duration?: number): Promise<string> {
  return invoke("scan_bluetooth", { duration });
}

export async function stopScan(): Promise<void> {
  return invoke("stop_scan");
}

export async function getDevices(): Promise<BluetoothDevice[]> {
  return invoke("get_devices");
}

export async function getScannerState(): Promise<string> {
  return invoke("get_scanner_state");
}

export async function clearDevices(): Promise<void> {
  return invoke("clear_devices");
}

// ==================== Device Management ====================

export async function pairDevice(device: BluetoothDevice): Promise<PairedDevice> {
  return invoke("pair_device", { device });
}

export async function unpairDevice(deviceId: string): Promise<void> {
  return invoke("unpair_device", { deviceId });
}

export async function getPairedDevices(): Promise<PairedDevice[]> {
  return invoke("get_paired_devices");
}

export async function updatePairedDevice(device: PairedDevice): Promise<void> {
  return invoke("update_paired_device", { device });
}

export async function isDevicePaired(deviceId: string): Promise<boolean> {
  return invoke("is_device_paired", { deviceId });
}

// ==================== Settings ====================

export async function getSettings(): Promise<AppSettings> {
  return invoke("get_settings");
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  return invoke("update_settings", { settings });
}

// ==================== Distance & Calibration ====================

export async function calibrateDevice(
  deviceId: string,
  distance: number,
  rssiSamples: number[]
): Promise<CalibrationData> {
  return invoke("calibrate_device", { deviceId, distance, rssiSamples });
}

export async function getDeviceDistance(deviceId: string, rssi: number): Promise<number> {
  return invoke("get_device_distance", { deviceId, rssi });
}

export async function resetDistanceFilter(deviceId: string): Promise<void> {
  return invoke("reset_distance_filter", { deviceId });
}

// ==================== System Control ====================

export async function lockScreen(): Promise<void> {
  return invoke("lock_screen");
}

export async function getLockState(): Promise<string> {
  return invoke("get_lock_state");
}

// ==================== Monitor ====================

export async function startMonitoring(): Promise<void> {
  return invoke("start_monitoring");
}

export async function stopMonitoring(): Promise<void> {
  return invoke("stop_monitoring");
}

export async function isMonitoring(): Promise<boolean> {
  return invoke("is_monitoring");
}

export async function getMonitorDistances(): Promise<[string, number | null][]> {
  return invoke("get_monitor_distances");
}

// ==================== Autostart ====================

export async function enableAutostart(): Promise<void> {
  const { enable } = await import("@tauri-apps/plugin-autostart");
  await enable();
}

export async function disableAutostart(): Promise<void> {
  const { disable } = await import("@tauri-apps/plugin-autostart");
  await disable();
}

export async function isAutostartEnabled(): Promise<boolean> {
  const { isEnabled } = await import("@tauri-apps/plugin-autostart");
  return isEnabled();
}

// ==================== Security ====================

export async function generateVerificationCode(deviceId: string): Promise<VerificationCode> {
  return invoke("generate_verification_code", { deviceId });
}

export async function verifyDeviceCode(deviceId: string, code: string): Promise<boolean> {
  return invoke("verify_device_code", { deviceId, code });
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  return invoke("get_audit_log");
}

export async function clearAuditLog(): Promise<void> {
  return invoke("clear_audit_log");
}

export async function setLanguage(language: string): Promise<void> {
  return invoke("set_language", { language });
}
