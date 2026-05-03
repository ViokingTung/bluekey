# BlueKey - Smart Bluetooth Unlocking System

<p align="center">
  <img src="./public/bluekey-blue.png" width="128" height="128" alt="BlueKey Logo">
</p>

<p align="center">
  <a href="https://github.com/ViokingTung/bluekey/releases"><img src="https://img.shields.io/github/v/release/ViokingTung/bluekey?style=flat-square&color=0a84ff" alt="Latest Release"></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri" alt="Tauri"></a>
  <a href="https://github.com/ViokingTung/bluekey/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ViokingTung/bluekey?style=flat-square" alt="License"></a>
</p>

[中文文档](README_zh.md) | English

BlueKey automatically detects your physical distance via Bluetooth devices (RSSI) to seamlessly lock your computer when you leave, and wake it when you approach. An imperceptible cross-platform security guardian making your digital life more elegant.

## 📸 Screenshots

<p align="center">
  <img src="./docs/en/device.png" width="45%" alt="Device List">
  <img src="./docs/en/device%20details.png" width="45%" alt="Device Details">
  <img src="./docs/en/device%20configuration.png" width="45%" alt="Device Configuration">
  <img src="./docs/en/settings.png" width="45%" alt="Settings Panel">
</p>

## ✨ Key Features

- 🔍 **Real-time BLE Scanning** - Automatically scans for nearby Bluetooth Low Energy (BLE) devices with extremely low latency and minimal power consumption.
- 📱 **Multi-Device Management** - Bind multiple devices (phones, smartwatches, iBeacons, etc.) and enable them simultaneously.
- 📏 **Dynamic Distance Estimation** - Precisely calculates physical distance using real-time RSSI signal conversion and Kalman filtering.
- 🎯 **One-Click Radar Calibration** - Offers graphical distance calibration to build an exclusive signal attenuation model based on the unique transmission power of each device.
- 🔓 **Auto Lock & Proximity Wake** - Automatically locks your computer when all devices move away, and wakes the screen/prepares for unlock when an authorized device comes into range (Respects OS security policies by not bypassing password screens).
- 🎨 **Modern Interface** - Built with TailwindCSS and a Glassmorphism design philosophy featuring elegant micro-animations.
- 🚥 **Smart System Tray Icon** - The status bar icon dynamically responds to the monitoring state (Blue when actively monitoring, Gray when idle).
- 🔐 **Strict Security Mechanism** - Device pairing verification codes and full-lifecycle system security audit logs.

---

## 💡 How It Works & Multi-Device Arbitration

The system uses `btleplug` in the background to capture high-frequency BLE advertisement packets from bonded devices and converts the Signal Strength (RSSI) into relative distance. To guarantee both convenience and security when you use multiple devices, BlueKey applies the following arbitration rules:

* **Proximity Wake (OR Logic)**: If **ANY ONE** enabled device enters your designated "Unlock Zone" and stays for the required duration, the computer is woken up seamlessly, ready for you to input your password/biometrics.
* **Auto Lock (AND Logic)**: To prevent accidental locking caused by temporary signal obstruction (e.g., covering your smartwatch), the system strictly requires that **ALL enabled devices** must fully exit the "Lock Zone" and remain out of range before issuing the lock command to the OS.

---

## 📱 Device Compatibility Guide

Due to differing Bluetooth broadcasting strategies across manufacturers, your experience may vary depending on the "key" you choose:

| Device Type | Compatibility Rating | Notes |
| :--- | :---: | :--- |
| **Pure Beacons (iBeacon/Tile, etc.)** | ⭐⭐⭐⭐⭐ | **Highly Recommended**. Specifically designed to be discovered. Broadcasts 24/7 with ultra-low power consumption. The perfect physical key. |
| **Apple Ecosystem** | ⭐⭐⭐⭐⭐ | iPhones, iPads, and Apple Watches deeply rely on BLE. They continuously broadcast stable signals in the background, providing a flawless experience. |
| **Wear OS / Full Smartwatches** | ⭐⭐⭐⭐ | With larger batteries, these typically maintain a high BLE broadcast frequency for ecosystem connectivity. Very responsive. |
| **Garmin / Pro Sports Watches** | ⭐⭐⭐⭐ | Many models support a "Broadcast Heart Rate (BLE)" toggle. When enabled, they serve as excellent unlocking keys. |
| **Android Phones** | ⭐⭐⭐ | Standard Android phones usually do not broadcast BLE packets continuously while the screen is off. They require a third-party BLE Beacon simulator app to be discovered reliably. |
| **Xiaomi Bands / Lite Wearables** | ⭐⭐ | To save battery, these devices **completely stop broadcasting publicly** when connected to a phone app (Silent Mode). BlueKey cannot scan them unless they are disconnected from the phone or put into an unbonded tracking state. |

---

## 🛠️ Technology Stack

- **Frontend Architecture**: React + TypeScript + Vite + TailwindCSS
- **Cross-Platform Host**: Tauri v2
- **Core Logic & OS Control**: Rust (Tokio async runtime)
- **Low-Level Bluetooth Driver**: `btleplug` (Cross-platform BLE manipulation API)

---

## 🚀 Development Guide

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Host machine must have a working Bluetooth adapter
- **Linux Users**: Ensure `bluez` is installed and your user is part of the `bluetooth` group to allow BLE scanning without root privileges.

### Local Build & Run

```bash
# 1. Install frontend dependencies
npm install

# 2. Start Tauri dev environment (Auto compiles Rust & HMR for Frontend)
npm run tauri dev

# 3. Build release bundle
npm run tauri build
```

---

## ⚙️ Core Configuration

| Parameter | Default Value | Description |
|------|--------|------|
| **RSSI_1M** | -59 dBm | Reference signal strength at 1 meter (can be overwritten via calibration) |
| **PATH_LOSS_EXPONENT** | 2.0 | Bluetooth signal spatial path loss exponent |
| **default_unlock_range** | 2.0m | Threshold distance to trigger an unlock action |
| **default_lock_range** | 5.0m | Threshold distance to trigger a lock action |
| **unlock_delay / lock_delay** | 2s / 5s | Debounce delay to prevent false triggers caused by sudden signal fluctuations |

---

## 💻 Cross-Platform Implementation Details

The system control module (Lock/Unlock) relies on the following native implementations across platforms:

| Platform | Screen Lock Method | Auto-Start Implementation | Bluetooth Stack |
|------|------|------|------|
| **macOS** | `pmset displaysleepnow` / ScreenSaverEngine | LaunchAgent | CoreBluetooth |
| **Windows** | `rundll32.exe user32.dll,LockWorkStation` | Windows Registry | Windows.Devices.Bluetooth |
| **Linux** | `loginctl` / `gnome-screensaver` / `xflock4` | Desktop Entry | BlueZ |

---

## 📄 License

This project is open-sourced under the [MIT License](./LICENSE).

**Version**: v0.1.4  
**Author**: Vioking
