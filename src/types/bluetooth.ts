export interface BluetoothDevice {
  id: string;
  name: string;
  device_type: DeviceType;
  rssi: number | null;
  connected: boolean;
  distance: number | null;
}

export type DeviceType =
  | "phone"
  | "watch"
  | "band"
  | "headphones"
  | "speaker"
  | "keyboard"
  | "mouse"
  | "other";

export interface ScannerState {
  state: "Idle" | "Scanning" | "Error";
}

export interface CalibrationData {
  rssi_1m: number;
  path_loss_exponent: number;
  samples: number;
}

export interface PairedDevice {
  id: string;
  name: string;
  device_type: DeviceType;
  enabled: boolean;
  priority: number;
  unlock_range: number;
  lock_range: number;
  added_at: number;
  last_seen: number | null;
  calibration: CalibrationData | null;
}

export interface AppSettings {
  default_unlock_range: number;
  default_lock_range: number;
  unlock_delay: number;
  lock_delay: number;
  scan_interval: number;
  notifications_enabled: boolean;
  auto_start: boolean;
  language: "system" | "zh-CN" | "en-US";
}

export type LockState = "Unlocked" | "Locked" | "Unknown";

export type ProximityStatus = "InRange" | "NearRange" | "OutOfRange" | "Unknown";

export interface MonitorEvent {
  type: "DeviceProximityChanged" | "LockStateChanged" | "AutoLockTriggered" | "AutoUnlockTriggered" | "Error";
  data?: {
    device_id?: string;
    distance?: number;
    status?: ProximityStatus;
    reason?: string;
    device_name?: string;
    message?: string;
  };
}

// ==================== Security ====================

export interface VerificationCode {
  code: string;
  generated_at: string;
  expires_at: string;
  device_id: string;
}

export type AuditEventType =
  | "DevicePaired"
  | "DeviceUnpaired"
  | "DeviceEnabled"
  | "DeviceDisabled"
  | "MonitoringStarted"
  | "MonitoringStopped"
  | "AutoLockTriggered"
  | "AutoUnlockTriggered"
  | "ManualLock"
  | "DeviceVerified"
  | "VerificationFailed"
  | "SettingsChanged";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event_type: AuditEventType;
  device_id: string | null;
  device_name: string | null;
  details: string | null;
  success: boolean;
}
