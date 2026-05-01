// Simple i18n system for BlueKey
import { useState, useEffect } from "react";

export type Language = "system" | "zh-CN" | "en-US";

const translations: Record<"zh-CN" | "en-US", Record<string, string>> = {
  "zh-CN": {
    // App
    "app.name": "BlueKey",
    "app.tagline": "蓝牙智能解锁助手",
    "app.description": "让您的 Mac 在靠近时自动解锁，远离时自动锁定，安全又便捷",
    
    // Navigation
    "nav.devices": "设备",
    "nav.activity": "活动",
    "nav.settings": "设置",
    
    // Devices
    "devices.title": "设备管理",
    "devices.add": "添加设备",
    "devices.scan": "扫描设备",
    "devices.scanning": "扫描中...",
    "devices.noDevices": "暂无配对设备",
    "devices.noDevicesHint": "点击上方按钮添加您的第一个设备",
    "devices.paired": "已配对设备",
    "devices.available": "可用设备",
    "devices.monitoring": "监控中",
    "devices.notMonitoring": "未监控",
    "devices.startMonitoring": "开始监控",
    "devices.stopMonitoring": "停止监控",
    "devices.lockScreen": "锁定屏幕",
    
    // Device Card
    "device.signal": "信号",
    "device.distance": "距离",
    "device.enabled": "已启用",
    "device.disabled": "已禁用",
    "device.priority": "优先级",
    "device.unlockRange": "解锁距离",
    "device.lockRange": "锁定距离",
    "device.calibrate": "校准",
    "device.configure": "配置",
    "device.unpair": "解绑",
    "device.lastSeen": "最后在线",
    "device.notCalibrated": "未校准",
    "device.calibrated": "已校准",
    
    // Device Detail
    "deviceDetail.title": "设备详情",
    "deviceDetail.status": "状态",
    "deviceDetail.signalHistory": "信号历史",
    "deviceDetail.calibrationInfo": "校准信息",
    "deviceDetail.actions": "操作",
    
    // Calibration
    "calibration.title": "距离校准",
    "calibration.calibrate": "校准",
    "calibration.introHint": "校准可以提高距离检测的准确性。请将设备放置在距离电脑 1米 处。",
    "calibration.step1": "将 {device} 放在距离电脑 1 米的位置",
    "calibration.step2": "保持设备静止，开始测量",
    "calibration.step3": "等待 10 秒完成采样",
    "calibration.step1.title": "准备校准",
    "calibration.step1.desc": "请确保您与电脑的距离为 1 米，然后点击开始校准",
    "calibration.step2.title": "采集数据",
    "calibration.step2.desc": "正在采集信号数据，请保持位置不动...",
    "calibration.step3.title": "校准完成",
    "calibration.step3.desc": "校准数据已保存，距离估算将更加准确",
    "calibration.start": "开始校准",
    "calibration.cancel": "取消",
    "calibration.done": "完成",
    "calibration.progress": "进度",
    "calibration.measuring": "正在测量...",
    "calibration.keepStill": "请保持 {device} 静止在 1 米距离",
    "calibration.currentSignal": "当前信号",
    "calibration.samples": "采样数",
    "calibration.measuringHint": "测量中，请勿移动设备...",
    "calibration.complete": "测量完成",
    "calibration.collected": "已采集 {count} 个样本",
    "calibration.rssi1m": "1米距离 RSSI",
    "calibration.retake": "重新测量",
    "calibration.confirm": "确认保存",
    "calibration.optimized": "{device} 的距离检测已优化",
    
    // Config Modal
    "config.title": "设备配置",
    "config.name": "设备名称",
    "config.namePlaceholder": "输入设备名称",
    "config.deviceType": "设备类型",
    "config.unlockDistance": "解锁距离",
    "config.lockDistance": "锁定距离",
    "config.priority": "优先级",
    "config.priorityHint": "高优先级设备优先触发解锁",
    "config.rangeTitle": "解锁/锁定范围",
    "config.unlockHint": "当设备进入此距离时自动解锁",
    "config.lockHint": "当设备离开此距离时自动锁定",
    "config.rangeError": "锁定距离应大于解锁距离",
    "config.improveAccuracy": "提高距离检测准确性",
    "config.performCalibration": "进行距离校准",
    "config.calibrationBaseline": "校准基准",
    "config.recalibrate": "重新校准",
    "config.calibrate": "校准距离",
    "config.save": "保存",
    "config.cancel": "取消",
    
    // Device Types
    "deviceType.phone": "手机",
    "deviceType.watch": "手表",
    "deviceType.band": "手环",
    "deviceType.headphones": "耳机",
    "deviceType.speaker": "音箱",
    "deviceType.keyboard": "键盘",
    "deviceType.mouse": "鼠标",
    "deviceType.other": "其他",
    
    // Signal Monitor
    "monitor.title": "信号监控",
    "monitor.card": "卡片",
    "monitor.waveform": "波形",
    "monitor.comparison": "对比",
    "monitor.radar": "雷达",
    "monitor.noSignal": "无信号",
    "monitor.rssi": "RSSI",
    
    // Settings
    "settings.title": "应用设置",
    "settings.description": "配置自动解锁行为和系统设置",
    "settings.autostart": "开机自启动",
    "settings.autostartHint": "系统启动时自动运行 BlueKey",
    "settings.unlockDistance": "默认解锁距离",
    "settings.unlockDistanceHint": "设备在此距离内时触发解锁",
    "settings.lockDistance": "默认锁定距离",
    "settings.lockDistanceHint": "设备超出此距离时触发锁定",
    "settings.unlockDelay": "解锁延迟",
    "settings.unlockDelayHint": "设备进入范围后等待此时间再解锁",
    "settings.lockDelay": "锁定延迟",
    "settings.lockDelayHint": "设备离开范围后等待此时间再锁定",
    "settings.notifications": "通知提醒",
    "settings.notificationsHint": "解锁/锁定时显示系统通知",
    "settings.language": "语言",
    "settings.languageHint": "选择应用显示语言",
    "settings.languageSystem": "系统",
    "settings.languageZh": "简体中文",
    "settings.languageEn": "英文",
    
    // Activity Log
    "activity.title": "活动日志",
    "activity.clear": "清空日志",
    "activity.noLogs": "暂无活动记录",
    "activity.devicePaired": "设备配对",
    "activity.deviceUnpaired": "设备解绑",
    "activity.monitoringStarted": "监控启动",
    "activity.monitoringStopped": "监控停止",
    "activity.autoLock": "自动锁定",
    "activity.autoUnlock": "自动解锁",
    "activity.manualLock": "手动锁定",
    
    // Scan View
    "scan.title": "扫描设备",
    "scan.scanning": "正在扫描附近的蓝牙设备...",
    "scan.found": "发现 {count} 个设备",
    "scan.noDevices": "未发现新设备",
    "scan.add": "添加",
    "scan.added": "已添加",
    "scan.close": "关闭",
    "scan.rescan": "重新扫描",
    "scan.stopScan": "停止扫描",
    
    // Onboarding
    "onboarding.welcome": "欢迎",
    "onboarding.features": "核心功能",
    "onboarding.bluetooth": "蓝牙权限",
    "onboarding.device": "添加设备",
    "onboarding.complete": "准备就绪",
    "onboarding.start": "开始使用",
    "onboarding.back": "返回",
    "onboarding.continue": "继续",
    "onboarding.feature.autoUnlock": "自动解锁",
    "onboarding.feature.autoUnlockDesc": "靠近 Mac 时自动解锁，无需手动输入密码",
    "onboarding.feature.secure": "安全可靠",
    "onboarding.feature.secureDesc": "蓝牙信号加密传输，支持距离验证",
    "onboarding.feature.multiDevice": "多设备支持",
    "onboarding.feature.multiDeviceDesc": "支持手机、手表、耳机等多种蓝牙设备",
    "onboarding.feature.precise": "精准定位",
    "onboarding.feature.preciseDesc": "校准后可精确控制解锁距离范围",
    "onboarding.bluetoothRequest": "授权蓝牙访问",
    "onboarding.bluetoothHint": "BlueKey 需要蓝牙权限来扫描和连接您的设备",
    "onboarding.bluetoothGranted": "权限已授权",
    "onboarding.bluetoothGrantedHint": "BlueKey 已获得蓝牙访问权限，可以开始扫描设备",
    "onboarding.addDeviceHint": "开始使用前，请添加一个蓝牙设备作为解锁钥匙",
    "onboarding.addDeviceStep1": "点击\"添加设备\"按钮",
    "onboarding.addDeviceStep2": "确保设备蓝牙已开启",
    "onboarding.addDeviceStep3": "从列表中选择并配对设备",
    "onboarding.completeHint": "您已完成初始设置，现在可以开始使用 BlueKey",
    "onboarding.tip": "小提示",
    "onboarding.tip1": "首次使用建议进行距离校准",
    "onboarding.tip2": "可在设置中调整解锁/锁定距离",
    "onboarding.tip3": "支持同时使用多个解锁设备",
    
    // Tray Menu
    "tray.unlocked": "已解锁",
    "tray.locked": "已锁定",
    "tray.noActiveDevice": "无活跃设备",
    "tray.lockNow": "立即锁定",
    "tray.pause": "暂停 BlueKey",
    "tray.resume": "恢复 BlueKey",
    "tray.open": "打开 BlueKey",
    "tray.settings": "设置",
    "tray.quit": "退出",
    
    // Common
    "common.save": "保存",
    "common.cancel": "取消",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.close": "关闭",
    "common.confirm": "确认",
    "common.loading": "加载中...",
    "common.error": "错误",
    "common.success": "成功",
    "common.enabled": "已启用",
    "common.disabled": "已禁用",
    "common.meters": "米",
    "common.seconds": "秒",
  },
  "en-US": {
    // App
    "app.name": "BlueKey",
    "app.tagline": "Bluetooth Smart Unlock",
    "app.description": "Automatically unlock your Mac when you approach, and lock when you leave",
    
    // Navigation
    "nav.devices": "Devices",
    "nav.activity": "Activity",
    "nav.settings": "Settings",
    
    // Devices
    "devices.title": "Device Management",
    "devices.add": "Add Device",
    "devices.scan": "Scan Devices",
    "devices.scanning": "Scanning...",
    "devices.noDevices": "No paired devices",
    "devices.noDevicesHint": "Click the button above to add your first device",
    "devices.paired": "Paired Devices",
    "devices.available": "Available Devices",
    "devices.monitoring": "Monitoring",
    "devices.notMonitoring": "Not Monitoring",
    "devices.startMonitoring": "Start Monitoring",
    "devices.stopMonitoring": "Stop Monitoring",
    "devices.lockScreen": "Lock Screen",
    
    // Device Card
    "device.signal": "Signal",
    "device.distance": "Distance",
    "device.enabled": "Enabled",
    "device.disabled": "Disabled",
    "device.priority": "Priority",
    "device.unlockRange": "Unlock Range",
    "device.lockRange": "Lock Range",
    "device.calibrate": "Calibrate",
    "device.configure": "Configure",
    "device.unpair": "Unpair",
    "device.lastSeen": "Last Seen",
    "device.notCalibrated": "Not Calibrated",
    "device.calibrated": "Calibrated",
    
    // Device Detail
    "deviceDetail.title": "Device Details",
    "deviceDetail.status": "Status",
    "deviceDetail.signalHistory": "Signal History",
    "deviceDetail.calibrationInfo": "Calibration Info",
    "deviceDetail.actions": "Actions",
    
    // Calibration
    "calibration.title": "Distance Calibration",
    "calibration.calibrate": "Calibrate",
    "calibration.introHint": "Calibration improves distance detection accuracy. Place the device 1 meter from the computer.",
    "calibration.step1": "Place {device} 1 meter from the computer",
    "calibration.step2": "Keep device still, start measuring",
    "calibration.step3": "Wait 10 seconds to complete sampling",
    "calibration.step1.title": "Prepare Calibration",
    "calibration.step1.desc": "Make sure you are 1 meter away from the computer, then click Start",
    "calibration.step2.title": "Collecting Data",
    "calibration.step2.desc": "Collecting signal data, please stay still...",
    "calibration.step3.title": "Calibration Complete",
    "calibration.step3.desc": "Calibration data saved, distance estimation will be more accurate",
    "calibration.start": "Start Calibration",
    "calibration.cancel": "Cancel",
    "calibration.done": "Done",
    "calibration.progress": "Progress",
    "calibration.measuring": "Measuring...",
    "calibration.keepStill": "Keep {device} still at 1 meter distance",
    "calibration.currentSignal": "Current Signal",
    "calibration.samples": "Samples",
    "calibration.measuringHint": "Measuring, do not move the device...",
    "calibration.complete": "Measurement Complete",
    "calibration.collected": "Collected {count} samples",
    "calibration.rssi1m": "RSSI at 1 meter",
    "calibration.retake": "Retake",
    "calibration.confirm": "Confirm & Save",
    "calibration.optimized": "Distance detection for {device} has been optimized",
    
    // Config Modal
    "config.title": "Device Configuration",
    "config.name": "Device Name",
    "config.namePlaceholder": "Enter device name",
    "config.deviceType": "Device Type",
    "config.unlockDistance": "Unlock Distance",
    "config.lockDistance": "Lock Distance",
    "config.priority": "Priority",
    "config.priorityHint": "Higher priority devices trigger unlock first",
    "config.rangeTitle": "Unlock/Lock Range",
    "config.unlockHint": "Auto-unlock when device enters this distance",
    "config.lockHint": "Auto-lock when device exceeds this distance",
    "config.rangeError": "Lock distance must be greater than unlock distance",
    "config.improveAccuracy": "Improve Distance Accuracy",
    "config.performCalibration": "Perform distance calibration",
    "config.calibrationBaseline": "Calibration Baseline",
    "config.recalibrate": "Recalibrate",
    "config.calibrate": "Calibrate Distance",
    "config.save": "Save",
    "config.cancel": "Cancel",
    
    // Device Types
    "deviceType.phone": "Phone",
    "deviceType.watch": "Watch",
    "deviceType.band": "Band",
    "deviceType.headphones": "Headphones",
    "deviceType.speaker": "Speaker",
    "deviceType.keyboard": "Keyboard",
    "deviceType.mouse": "Mouse",
    "deviceType.other": "Other",
    
    // Signal Monitor
    "monitor.title": "Signal Monitor",
    "monitor.card": "Card",
    "monitor.waveform": "Waveform",
    "monitor.comparison": "Comparison",
    "monitor.radar": "Radar",
    "monitor.noSignal": "No Signal",
    "monitor.rssi": "RSSI",
    
    // Settings
    "settings.title": "Application Settings",
    "settings.description": "Configure auto-unlock behavior and system settings",
    "settings.autostart": "Launch at Login",
    "settings.autostartHint": "Automatically run BlueKey when system starts",
    "settings.unlockDistance": "Default Unlock Distance",
    "settings.unlockDistanceHint": "Trigger unlock when device is within this distance",
    "settings.lockDistance": "Default Lock Distance",
    "settings.lockDistanceHint": "Trigger lock when device exceeds this distance",
    "settings.unlockDelay": "Unlock Delay",
    "settings.unlockDelayHint": "Wait this time after device enters range before unlocking",
    "settings.lockDelay": "Lock Delay",
    "settings.lockDelayHint": "Wait this time after device leaves range before locking",
    "settings.notifications": "Notifications",
    "settings.notificationsHint": "Show system notifications on lock/unlock",
    "settings.language": "Language",
    "settings.languageHint": "Select application display language",
    "settings.languageSystem": "System",
    "settings.languageZh": "Chinese",
    "settings.languageEn": "English",

    // Activity Log
    "activity.title": "Activity Log",
    "activity.clear": "Clear Log",
    "activity.noLogs": "No activity records",
    "activity.devicePaired": "Device Paired",
    "activity.deviceUnpaired": "Device Unpaired",
    "activity.monitoringStarted": "Monitoring Started",
    "activity.monitoringStopped": "Monitoring Stopped",
    "activity.autoLock": "Auto Lock",
    "activity.autoUnlock": "Auto Unlock",
    "activity.manualLock": "Manual Lock",

    // Scan View
    "scan.title": "Scan Devices",
    "scan.scanning": "Scanning for nearby Bluetooth devices...",
    "scan.found": "Found {count} devices",
    "scan.noDevices": "No new devices found",
    "scan.add": "Add",
    "scan.added": "Added",
    "scan.close": "Close",
    "scan.rescan": "Rescan",
    "scan.stopScan": "Stop Scan",
    
    // Onboarding
    "onboarding.welcome": "Welcome",
    "onboarding.features": "Core Features",
    "onboarding.bluetooth": "Bluetooth Permission",
    "onboarding.device": "Add Device",
    "onboarding.complete": "Ready to Go",
    "onboarding.start": "Get Started",
    "onboarding.back": "Back",
    "onboarding.continue": "Continue",
    "onboarding.feature.autoUnlock": "Auto Unlock",
    "onboarding.feature.autoUnlockDesc": "Automatically unlock when approaching your Mac",
    "onboarding.feature.secure": "Secure",
    "onboarding.feature.secureDesc": "Encrypted Bluetooth signal with distance verification",
    "onboarding.feature.multiDevice": "Multi-Device",
    "onboarding.feature.multiDeviceDesc": "Support phones, watches, headphones and more",
    "onboarding.feature.precise": "Precise Positioning",
    "onboarding.feature.preciseDesc": "Calibrate for accurate unlock distance control",
    "onboarding.bluetoothRequest": "Authorize Bluetooth",
    "onboarding.bluetoothHint": "BlueKey needs Bluetooth permission to scan and connect devices",
    "onboarding.bluetoothGranted": "Permission Granted",
    "onboarding.bluetoothGrantedHint": "BlueKey has Bluetooth access, ready to scan devices",
    "onboarding.addDeviceHint": "Add a Bluetooth device as your unlock key to get started",
    "onboarding.addDeviceStep1": "Click \"Add Device\" button",
    "onboarding.addDeviceStep2": "Make sure device Bluetooth is on",
    "onboarding.addDeviceStep3": "Select and pair device from list",
    "onboarding.completeHint": "Setup complete! You can now start using BlueKey",
    "onboarding.tip": "Tips",
    "onboarding.tip1": "Calibrate distance for best results",
    "onboarding.tip2": "Adjust unlock/lock range in settings",
    "onboarding.tip3": "Use multiple devices for unlock",
    
    // Tray Menu
    "tray.unlocked": "Unlocked",
    "tray.locked": "Locked",
    "tray.noActiveDevice": "No Active Device",
    "tray.lockNow": "Lock Now",
    "tray.pause": "Pause BlueKey",
    "tray.resume": "Resume BlueKey",
    "tray.open": "Open BlueKey",
    "tray.settings": "Settings",
    "tray.quit": "Quit",
    
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.enabled": "Enabled",
    "common.disabled": "Disabled",
    "common.meters": "m",
    "common.seconds": "s",
  },
};

let currentLanguage: "zh-CN" | "en-US" = "zh-CN";

export function setLanguage(lang: Language): void {
  if (lang === "system") {
    // Detect system language
    const systemLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || "en-US";
    currentLanguage = systemLang.startsWith("zh") ? "zh-CN" : "en-US";
  } else {
    currentLanguage = lang;
  }
  // Dispatch event for components to re-render
  window.dispatchEvent(new CustomEvent("languagechange", { detail: currentLanguage }));
}

export function getLanguage(): "zh-CN" | "en-US" {
  return currentLanguage;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const translation = translations[currentLanguage]?.[key] ?? key;
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
      translation
    );
  }
  
  return translation;
}

// Hook for React components
export function useTranslation(): { t: typeof t; lang: "zh-CN" | "en-US" } {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const handler = () => forceUpdate({});
    window.addEventListener("languagechange", handler);
    return () => window.removeEventListener("languagechange", handler);
  }, []);
  
  return { t, lang: currentLanguage };
}
