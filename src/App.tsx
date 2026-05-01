import { useState, useEffect, useCallback } from "react";
import { Sidebar, SidebarItem } from "./components/ui/Sidebar";
import { DevicesView } from "./components/DevicesView";
import { DeviceDetail } from "./components/DeviceDetail";
import { ScanView } from "./components/ScanView";
import { SettingsPanel } from "./components/SettingsPanel";
import { AuditLogPanel } from "./components/AuditLogPanel";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { setLanguage, useTranslation } from "./lib/i18n";
import {
  scanBluetooth, stopScan, getDevices, getScannerState,
  pairDevice, unpairDevice, getPairedDevices, updatePairedDevice,
  startMonitoring, stopMonitoring, isMonitoring, lockScreen, getSettings,
} from "./api/bluetooth";
import type { BluetoothDevice, PairedDevice, CalibrationData } from "./types/bluetooth";

type ViewType = "devices" | "activity" | "settings";

const ONBOARDING_COMPLETE_KEY = "bluekey_onboarding_complete";

function App() {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewType>("devices");
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<PairedDevice | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check first launch on mount
  useEffect(() => {
    const onboardingComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
    loadPairedDevices();
    checkMonitoringState();
    loadAndInitLanguage();

    // Listen for tray menu navigation events
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<string>("navigate", (event) => {
        const target = event.payload;
        if (target === "settings" || target === "devices" || target === "activity") {
          setView(target as ViewType);
        }
      }).then((fn) => { unlisten = fn; });
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const loadAndInitLanguage = async () => {
    try {
      const settings = await getSettings();
      setLanguage(settings.language);
    } catch {
      // Use default language
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    setShowOnboarding(false);
  };

  const loadPairedDevices = async () => {
    try {
      const devices = await getPairedDevices();
      setPairedDevices(devices);

      // Auto-start monitoring if there are enabled devices
      const hasEnabledDevices = devices.some(d => d.enabled);
      const monitoringActive = await isMonitoring();

      if (hasEnabledDevices) {
        if (!monitoringActive) {
          await startMonitoring();
          setMonitoring(true);
        } else {
          setMonitoring(true);
        }
      } else {
        // No enabled devices - stop monitoring if running
        if (monitoringActive) {
          await stopMonitoring();
          setMonitoring(false);
        }
      }
    } catch (e) {
      console.error("Failed to load paired devices:", e);
    }
  };

  const checkMonitoringState = async () => {
    try {
      const result = await isMonitoring();
      setMonitoring(result);
    } catch {
      // Ignore
    }
  };

  const checkState = useCallback(async () => {
    try {
      const state = await getScannerState();
      setIsScanning(state === "Scanning");
    } catch {
      // Ignore state check errors
    }
  }, []);

  useEffect(() => {
    checkState();
    const interval = setInterval(checkState, 1000);
    return () => clearInterval(interval);
  }, [checkState]);

  useEffect(() => {
    if (isScanning) {
      const fetchDevices = async () => {
        try {
          const deviceList = await getDevices();
          setDevices(deviceList);
        } catch (e) {
          console.error("Failed to fetch devices:", e);
        }
      };
      
      const interval = setInterval(fetchDevices, 500);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const handleStartScan = async () => {
    try {
      await scanBluetooth(10);
      setIsScanning(true);
    } catch (e) {
      console.error("Scan failed:", e);
    }
  };

  const handleStopScan = async () => {
    try {
      await stopScan();
      setIsScanning(false);
    } catch (e) {
      console.error("Stop scan failed:", e);
    }
  };

  const handlePairDevice = async (device: BluetoothDevice) => {
    try {
      await pairDevice(device);
      await loadPairedDevices();
    } catch (e) {
      console.error("Pair failed:", e);
    }
  };

  const handleUnpairDevice = async (deviceId: string) => {
    try {
      await unpairDevice(deviceId);
      setSelectedDevice(null);
      await loadPairedDevices();
    } catch (e) {
      console.error("Unpair failed:", e);
    }
  };

  const handleToggleEnabled = async (device: PairedDevice) => {
    try {
      await updatePairedDevice({
        ...device,
        enabled: !device.enabled,
      });
      await loadPairedDevices();
    } catch (e) {
      console.error("Toggle failed:", e);
    }
  };

  const handleCalibrate = async (device: PairedDevice, calibration: CalibrationData) => {
    try {
      await updatePairedDevice({
        ...device,
        calibration,
      });
      await loadPairedDevices();
    } catch (e) {
      console.error("Calibration save failed:", e);
    }
  };

  const handleUpdateDevice = async (device: PairedDevice, updates: Partial<PairedDevice>) => {
    try {
      await updatePairedDevice({
        ...device,
        ...updates,
      });
      await loadPairedDevices();
    } catch (e) {
      console.error("Update device failed:", e);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await startMonitoring();
      setMonitoring(true);
    } catch (e) {
      console.error("Start monitoring failed:", e);
    }
  };

  const handleStopMonitoring = async () => {
    try {
      await stopMonitoring();
      setMonitoring(false);
    } catch (e) {
      console.error("Stop monitoring failed:", e);
    }
  };

  const handleLockScreen = async () => {
    try {
      await lockScreen();
    } catch (e) {
      console.error("Lock screen failed:", e);
    }
  };

  // Get page title based on current view
  const getPageTitle = () => {
    switch (view) {
      case "devices":
        return t("devices.title");
      case "activity":
        return t("activity.title");
      case "settings":
        return t("settings.title");
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Sidebar */}
      <Sidebar
        logo={
          <img src="/bluekey-blue.png" alt="BlueKey" className="w-5 h-5 object-contain drop-shadow" />
        }
        title={t("app.name")}
        tagline={t("app.tagline")}
        footer={
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
              <span>{t("app.tagline")}</span>
            </div>
            <div>v1.0 · {pairedDevices.filter(d => d.enabled).length} {t("device.enabled")}</div>
          </div>
        }
      >
        <SidebarItem
          icon="list"
          label={t("nav.devices")}
          active={view === "devices"}
          onClick={() => setView("devices")}
        />
        <SidebarItem
          icon="wave"
          label={t("nav.activity")}
          active={view === "activity"}
          onClick={() => setView("activity")}
        />
        <SidebarItem
          icon="gear"
          label={t("nav.settings")}
          active={view === "settings"}
          onClick={() => setView("settings")}
        />
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-11 flex items-center px-4 gap-2.5 border-b border-border-soft bg-surface/50" data-tauri-drag-region>
          <span className="font-display text-sm font-semibold tracking-tight" data-tauri-drag-region>
            {getPageTitle()}
          </span>
          <div className="flex-1" data-tauri-drag-region />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {view === "devices" && (
            <DevicesView
              pairedDevices={pairedDevices}
              monitoring={monitoring}
              onAddDevice={() => setScanModalOpen(true)}
              onStartMonitoring={handleStartMonitoring}
              onStopMonitoring={handleStopMonitoring}
              onLockScreen={handleLockScreen}
              onToggleEnabled={handleToggleEnabled}
              onSelectDevice={(device) => setSelectedDevice(device)}
            />
          )}
          {view === "activity" && (
            <div className="p-4">
              <AuditLogPanel />
            </div>
          )}
          {view === "settings" && (
            <div className="p-4">
              <SettingsPanel />
            </div>
          )}
        </div>
      </div>

      {/* Scan Modal */}
      <ScanView
        isOpen={scanModalOpen}
        isScanning={isScanning}
        devices={devices}
        pairedDevices={pairedDevices}
        onStartScan={handleStartScan}
        onStopScan={handleStopScan}
        onAddDevice={handlePairDevice}
        onClose={() => setScanModalOpen(false)}
      />

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onToggleEnabled={handleToggleEnabled}
          onUnpair={handleUnpairDevice}
          onCalibrate={handleCalibrate}
          onUpdateDevice={handleUpdateDevice}
        />
      )}

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}

export default App;
