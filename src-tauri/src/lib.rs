   //! BlueKey - Bluetooth Smart Unlock System
//! 
//! Main library module for Tauri application

mod bluetooth;
mod security;
mod system;

use bluetooth::{
    AppSettings, BluetoothDevice, BluetoothScanner, 
    CalibrationData, DeviceStorage, DistanceEstimator, 
    PairedDevice,
};
use security::{AuditEventType, AuditLogEntry, SecurityManager, VerificationCode};
use system::{ProximityMonitor, SystemController};
use std::sync::Arc;
use tauri::{Manager, Emitter};
use tokio::sync::Mutex;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::sync::atomic::{AtomicU8, Ordering};

/// Current language: 0 = system, 1 = zh-CN, 2 = en-US
static CURRENT_LANG: AtomicU8 = AtomicU8::new(0);

/// Global scanner instance
struct ScannerWrapper(Arc<Mutex<BluetoothScanner>>);

/// Global storage instance
struct StorageWrapper(Arc<Mutex<DeviceStorage>>);

/// Global distance estimator
struct DistanceWrapper(Arc<Mutex<DistanceEstimator>>);

/// Global system controller
struct SystemControllerWrapper(Arc<Mutex<SystemController>>);

/// Global proximity monitor
struct MonitorWrapper(Arc<Mutex<ProximityMonitor>>);

/// Global security manager
struct SecurityWrapper(Arc<Mutex<SecurityManager>>);

// ==================== Scanner Commands ====================

/// Scan for Bluetooth devices
#[tauri::command]
async fn scan_bluetooth(
    duration: Option<u64>,
    scanner: tauri::State<'_, ScannerWrapper>,
) -> Result<String, String> {
    let scanner = scanner.0.lock().await;
    let scan_duration = duration.map(|d| std::time::Duration::from_secs(d));
    
    scanner
        .start_scan(scan_duration)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok("Scan started".to_string())
}

/// Stop ongoing scan
#[tauri::command]
async fn stop_scan(scanner: tauri::State<'_, ScannerWrapper>) -> Result<(), String> {
    let scanner = scanner.0.lock().await;
    scanner
        .stop_scan()
        .await
        .map_err(|e| e.to_string())
}

/// Get all discovered devices
#[tauri::command]
async fn get_devices(scanner: tauri::State<'_, ScannerWrapper>) -> Result<Vec<BluetoothDevice>, String> {
    let scanner = scanner.0.lock().await;
    Ok(scanner.get_devices().await)
}

/// Get scanner state
#[tauri::command]
async fn get_scanner_state(scanner: tauri::State<'_, ScannerWrapper>) -> Result<String, String> {
    let scanner = scanner.0.lock().await;
    let state = scanner.state().await;
    Ok(format!("{:?}", state))
}

/// Clear discovered devices
#[tauri::command]
async fn clear_devices(scanner: tauri::State<'_, ScannerWrapper>) -> Result<(), String> {
    let scanner = scanner.0.lock().await;
    scanner.clear_devices().await;
    Ok(())
}

// ==================== Device Management Commands ====================

/// Pair a device (add to paired devices list)
#[tauri::command]
async fn pair_device(
    device: BluetoothDevice,
    storage: tauri::State<'_, StorageWrapper>,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<PairedDevice, String> {
    let storage = storage.0.lock().await;
    let paired = storage
        .add_device(device.clone())
        .await
        .map_err(|e| e.to_string())?;
    drop(storage);

    // Log event
    let security = security.0.lock().await;
    security.log_event(
        AuditEventType::DevicePaired,
        Some(device.id.clone()),
        Some(device.name.clone()),
        None,
        true,
    ).await;

    Ok(paired)
}

/// Unpair a device
#[tauri::command]
async fn unpair_device(
    device_id: String,
    storage: tauri::State<'_, StorageWrapper>,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<(), String> {
    let storage = storage.0.lock().await;
    let device_name = storage.get_paired_device(&device_id).await.map(|d| d.name);
    storage
        .remove_device(&device_id)
        .await
        .map_err(|e| e.to_string())?;
    drop(storage);

    // Log event
    let security = security.0.lock().await;
    security.log_event(
        AuditEventType::DeviceUnpaired,
        Some(device_id),
        device_name,
        None,
        true,
    ).await;

    Ok(())
}

/// Get all paired devices
#[tauri::command]
async fn get_paired_devices(
    storage: tauri::State<'_, StorageWrapper>,
) -> Result<Vec<PairedDevice>, String> {
    let storage = storage.0.lock().await;
    Ok(storage.get_paired_devices().await)
}

/// Update paired device settings
#[tauri::command]
async fn update_paired_device(
    device: PairedDevice,
    storage: tauri::State<'_, StorageWrapper>,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<(), String> {
    // Check if enabled state changed
    let was_enabled = {
        let storage = storage.0.lock().await;
        storage.get_paired_device(&device.id).await.map(|d| d.enabled)
    };

    let storage = storage.0.lock().await;
    storage
        .update_device(device.clone())
        .await
        .map_err(|e| e.to_string())?;
    drop(storage);

    // Log enable/disable event if changed
    if was_enabled != Some(device.enabled) {
        let security = security.0.lock().await;
        security.log_event(
            if device.enabled { AuditEventType::DeviceEnabled } else { AuditEventType::DeviceDisabled },
            Some(device.id.clone()),
            Some(device.name.clone()),
            None,
            true,
        ).await;
    }

    Ok(())
}

/// Check if a device is paired
#[tauri::command]
async fn is_device_paired(
    device_id: String,
    storage: tauri::State<'_, StorageWrapper>,
) -> Result<bool, String> {
    let storage = storage.0.lock().await;
    Ok(storage.is_paired(&device_id).await)
}

// ==================== Settings Commands ====================

/// Get application settings
#[tauri::command]
async fn get_settings(
    storage: tauri::State<'_, StorageWrapper>,
) -> Result<AppSettings, String> {
    let storage = storage.0.lock().await;
    Ok(storage.get_settings().await)
}

/// Update application settings
#[tauri::command]
async fn update_settings(
    settings: AppSettings,
    storage: tauri::State<'_, StorageWrapper>,
    monitor: tauri::State<'_, MonitorWrapper>,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<(), String> {
    let storage = storage.0.lock().await;
    storage
        .update_settings(settings.clone())
        .await
        .map_err(|e| e.to_string())?;
    drop(storage);

    // Update running monitor with new settings
    let monitor = monitor.0.lock().await;
    monitor.update_settings(settings.clone()).await;
    drop(monitor);

    // Log settings change
    let security = security.0.lock().await;
    security.log_event(
        AuditEventType::SettingsChanged,
        None,
        None,
        None,
        true,
    ).await;

    Ok(())
}

/// Set language and update tray menu
#[tauri::command]
async fn set_language(
    language: String,
    app: tauri::AppHandle,
    storage: tauri::State<'_, StorageWrapper>,
) -> Result<(), String> {
    // Update language state
    let lang_code = match language.as_str() {
        "zh-CN" => 1,
        "en-US" => 2,
        _ => 0, // system
    };
    CURRENT_LANG.store(lang_code, Ordering::Relaxed);
    
    // Update settings in storage
    let storage = storage.0.lock().await;
    let mut settings = storage.get_settings().await;
    settings.language = language.clone();
    storage.update_settings(settings).await.map_err(|e| e.to_string())?;
    drop(storage);
    
    // Update tray menu with new language (don't rebuild, just update menu)
    update_tray_menu(&app, language).map_err(|e| e.to_string())
}

// ==================== Distance & Calibration Commands ====================

/// Calibrate device distance
#[tauri::command]
async fn calibrate_device(
    device_id: String,
    distance: f64,
    rssi_samples: Vec<i16>,
    storage: tauri::State<'_, StorageWrapper>,
    distance_estimator: tauri::State<'_, DistanceWrapper>,
) -> Result<CalibrationData, String> {
    // Perform calibration
    let estimator = distance_estimator.0.lock().await;
    let calibration = estimator.calibrate_at_distance(&device_id, distance, rssi_samples).await;
    
    // Update paired device with calibration
    let storage = storage.0.lock().await;
    if let Some(mut device) = storage.get_paired_device(&device_id).await {
        device.calibration = Some(calibration.clone());
        let _ = storage.update_device(device).await;
    }
    
    Ok(calibration)
}

/// Get distance estimate for a device
#[tauri::command]
async fn get_device_distance(
    device_id: String,
    rssi: i16,
    distance_estimator: tauri::State<'_, DistanceWrapper>,
) -> Result<f64, String> {
    let estimator = distance_estimator.0.lock().await;
    Ok(estimator.estimate_distance(&device_id, rssi).await)
}

/// Reset distance filter for a device
#[tauri::command]
async fn reset_distance_filter(
    device_id: String,
    distance_estimator: tauri::State<'_, DistanceWrapper>,
) -> Result<(), String> {
    let estimator = distance_estimator.0.lock().await;
    estimator.reset_filter(&device_id).await;
    Ok(())
}

// ==================== System Control Commands ====================

/// Lock the screen
#[tauri::command]
async fn lock_screen(
    controller: tauri::State<'_, SystemControllerWrapper>,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<(), String> {
    let controller = controller.0.lock().await;
    controller.lock_screen().await.map_err(|e| e.to_string())?;
    drop(controller);

    // Log manual lock
    let security = security.0.lock().await;
    security.log_event(
        AuditEventType::ManualLock,
        None,
        None,
        None,
        true,
    ).await;

    Ok(())
}

/// Get lock state
#[tauri::command]
async fn get_lock_state(
    controller: tauri::State<'_, SystemControllerWrapper>,
) -> Result<String, String> {
    let controller = controller.0.lock().await;
    let state = controller.get_state().await;
    Ok(format!("{:?}", state))
}

// ==================== Monitor Commands ====================

/// Start proximity monitoring
#[tauri::command]
async fn start_monitoring(
    app: tauri::AppHandle,
    monitor: tauri::State<'_, MonitorWrapper>,
    storage: tauri::State<'_, StorageWrapper>,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<(), String> {
    // Load paired devices and settings
    let storage = storage.0.lock().await;
    let paired_devices = storage.get_paired_devices().await;
    let settings = storage.get_settings().await;
    drop(storage);

    // Update monitor with devices and settings
    let monitor = monitor.0.lock().await;
    monitor.update_paired_devices(paired_devices).await;
    monitor.update_settings(settings).await;
    let actually_started = monitor.start().await.map_err(|e| e.to_string())?;
    drop(monitor);

    // Only log if monitoring actually started (wasn't already running)
    if actually_started {
        let security = security.0.lock().await;
        security.log_event(
            AuditEventType::MonitoringStarted,
            None,
            None,
            None,
            true,
        ).await;
    }

    update_tray_icon_state(&app, true);

    Ok(())
}

/// Stop proximity monitoring
#[tauri::command]
async fn stop_monitoring(
    app: tauri::AppHandle,
    monitor: tauri::State<'_, MonitorWrapper>,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<(), String> {
    let monitor = monitor.0.lock().await;
    monitor.stop().await;
    drop(monitor);

    // Log event
    let security = security.0.lock().await;
    security.log_event(
        AuditEventType::MonitoringStopped,
        None,
        None,
        None,
        true,
    ).await;

    update_tray_icon_state(&app, false);

    Ok(())
}

/// Check if monitoring is running
#[tauri::command]
async fn is_monitoring(
    monitor: tauri::State<'_, MonitorWrapper>,
) -> Result<bool, String> {
    let monitor = monitor.0.lock().await;
    Ok(monitor.is_running().await)
}

/// Get device distances from monitor
#[tauri::command]
async fn get_monitor_distances(
    monitor: tauri::State<'_, MonitorWrapper>,
) -> Result<Vec<(String, Option<f64>)>, String> {
    let monitor = monitor.0.lock().await;
    let distances = monitor.get_device_distances().await;
    Ok(distances.into_iter().collect())
}

// ==================== Autostart Commands ====================
// Autostart is handled via JS API (@tauri-apps/plugin-autostart)
// No Rust commands needed

// ==================== Security Commands ====================

/// Generate verification code for a device
#[tauri::command]
async fn generate_verification_code(
    device_id: String,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<VerificationCode, String> {
    let security = security.0.lock().await;
    Ok(security.generate_code(device_id).await)
}

/// Verify a device code
#[tauri::command]
async fn verify_device_code(
    device_id: String,
    code: String,
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<bool, String> {
    let security = security.0.lock().await;
    let valid = security.verify_code(&device_id, &code).await;
    
    // Log the verification attempt
    security.log_event(
        if valid { AuditEventType::DeviceVerified } else { AuditEventType::VerificationFailed },
        Some(device_id),
        None,
        Some(format!("Code: {}", code)),
        valid,
    ).await;
    
    Ok(valid)
}

/// Get audit log entries
#[tauri::command]
async fn get_audit_log(
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<Vec<AuditLogEntry>, String> {
    let security = security.0.lock().await;
    let audit = security.get_audit_log().await;
    let audit = audit.lock().await;
    Ok(audit.get_entries().await)
}

/// Clear audit log
#[tauri::command]
async fn clear_audit_log(
    security: tauri::State<'_, SecurityWrapper>,
) -> Result<(), String> {
    let security = security.0.lock().await;
    let audit = security.get_audit_log().await;
    let audit = audit.lock().await;
    audit.clear().await;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]), /* Arguments to pass to the app when it's launched */
        ))
        .setup(|app| {
            // Get app data directory
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data directory");
            
            // Create scanner instance
            let scanner = Arc::new(Mutex::new(BluetoothScanner::new()));
            
            // Create storage instance and load data
            let storage = Arc::new(Mutex::new(DeviceStorage::new(app_data_dir)));
            
            // Create distance estimator
            let distance_estimator = Arc::new(Mutex::new(DistanceEstimator::new()));
            
            // Create system controller
            let system_controller = Arc::new(Mutex::new(SystemController::new()));
            
            // Create proximity monitor
            let monitor = Arc::new(Mutex::new(ProximityMonitor::new(
                scanner.clone(),
                distance_estimator.clone(),
                system_controller.clone(),
            )));
            
            // Create security manager
            let security = Arc::new(Mutex::new(SecurityManager::new()));
            
            // Load stored data asynchronously
            let storage_clone = storage.clone();
            tauri::async_runtime::spawn(async move {
                let storage = storage_clone.lock().await;
                if let Err(e) = storage.load().await {
                    tracing::error!("Failed to load storage: {}", e);
                }
            });
            
            // Manage state
            app.manage(ScannerWrapper(scanner));
            app.manage(StorageWrapper(storage));
            app.manage(DistanceWrapper(distance_estimator));
            app.manage(SystemControllerWrapper(system_controller));
            app.manage(MonitorWrapper(monitor));
            app.manage(SecurityWrapper(security));
            
            // Setup system tray
            setup_tray(app.handle())?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Scanner
            scan_bluetooth,
            stop_scan,
            get_devices,
            get_scanner_state,
            clear_devices,
            // Device Management
            pair_device,
            unpair_device,
            get_paired_devices,
            update_paired_device,
            is_device_paired,
            // Settings
            get_settings,
            update_settings,
            set_language,
            // Distance & Calibration
            calibrate_device,
            get_device_distance,
            reset_distance_filter,
            // System Control
            lock_screen,
            get_lock_state,
            // Monitor
            start_monitoring,
            stop_monitoring,
            is_monitoring,
            get_monitor_distances,
            // Security
            generate_verification_code,
            verify_device_code,
            get_audit_log,
            clear_audit_log,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Hide window instead of closing (keep app running in tray)
                window.hide().unwrap();
                api.prevent_close();
                
                #[cfg(target_os = "macos")]
                {
                    let _ = window.app_handle().set_activation_policy(tauri::ActivationPolicy::Accessory);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Setup system tray
fn setup_tray(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    setup_tray_with_lang(app, get_current_lang())
}

/// Helper to update tray icon based on state
fn update_tray_icon_state(app: &tauri::AppHandle, is_running: bool) {
    if let Some(tray) = app.tray_by_id("main") {
        let icon = if is_running {
            tauri::include_image!("./icons/tray-blue.png")
        } else {
            tauri::include_image!("./icons/tray-gray.png")
        };
        let _ = tray.set_icon(Some(icon));
    }
}

/// Get current language string
fn get_current_lang() -> String {
    let lang = CURRENT_LANG.load(Ordering::Relaxed);
    match lang {
        1 => "zh-CN".to_string(),
        2 => "en-US".to_string(),
        _ => {
            // System language - detect from system locale
            let sys_lang = std::env::var("LANG").unwrap_or_else(|_| "en".to_string());
            if sys_lang.starts_with("zh") { "zh-CN" } else { "en-US" }.to_string()
        }
    }
}

/// Update tray menu without rebuilding the tray
fn update_tray_menu(app: &tauri::AppHandle, lang: String) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
    
    let is_zh = lang == "zh-CN";
    
    // Header: BlueKey title (disabled, showing device info)
    let header_i = MenuItem::with_id(app, "header", "BlueKey", false, None::<&str>)?;
    let device_info_i = MenuItem::with_id(app, "device_info", if is_zh { "  无活跃设备" } else { "  No Active Device" }, false, None::<&str>)?;
    
    // Status: 已解锁 (disabled, indicator)
    let status_i = MenuItem::with_id(app, "status", if is_zh { "🔓  已解锁" } else { "🔓  Unlocked" }, false, None::<&str>)?;
    
    // Actions
    let lock_i = MenuItem::with_id(app, "lock", if is_zh { "立即锁定" } else { "Lock Now" }, true, Some("CmdOrCtrl+Alt+Ctrl+L"))?;
    let toggle_monitor_i = MenuItem::with_id(app, "toggle_monitor", if is_zh { "暂停 BlueKey" } else { "Pause BlueKey" }, true, None::<&str>)?;
    
    // Window controls
    let show_i = MenuItem::with_id(app, "show", if is_zh { "打开 BlueKey" } else { "Open BlueKey" }, true, None::<&str>)?;
    let settings_i = MenuItem::with_id(app, "settings", if is_zh { "设置" } else { "Settings" }, true, None::<&str>)?;
    
    // Quit
    let quit_i = MenuItem::with_id(app, "quit", if is_zh { "退出" } else { "Quit" }, true, None::<&str>)?;
    
    let separator = PredefinedMenuItem::separator(app)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    
    let menu = Menu::with_items(app, &[
        &header_i,
        &device_info_i,
        &separator,
        &status_i,
        &lock_i,
        &toggle_monitor_i,
        &separator2,
        &show_i,
        &settings_i,
        &separator3,
        &quit_i,
    ])?;
    
    // Update existing tray's menu
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_menu(Some(menu))?;
        let tooltip = if is_zh { "BlueKey - 蓝牙智能解锁" } else { "BlueKey - Bluetooth Smart Unlock" };
        tray.set_tooltip(Some(tooltip))?;
    }
    
    Ok(())
}

/// Setup system tray with specific language
fn setup_tray_with_lang(app: &tauri::AppHandle, lang: String) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
    use tauri::tray::TrayIconBuilder;
    
    let is_zh = lang == "zh-CN";
    
    // Header: BlueKey title (disabled, showing device info)
    let header_i = MenuItem::with_id(app, "header", "BlueKey", false, None::<&str>)?;
    let device_info_i = MenuItem::with_id(app, "device_info", if is_zh { "  无活跃设备" } else { "  No Active Device" }, false, None::<&str>)?;
    
    // Status: 已解锁 (disabled, indicator)
    let status_i = MenuItem::with_id(app, "status", if is_zh { "🔓  已解锁" } else { "🔓  Unlocked" }, false, None::<&str>)?;
    
    // Actions
    let lock_i = MenuItem::with_id(app, "lock", if is_zh { "立即锁定" } else { "Lock Now" }, true, Some("CmdOrCtrl+Alt+Ctrl+L"))?;
    let toggle_monitor_i = MenuItem::with_id(app, "toggle_monitor", if is_zh { "暂停 BlueKey" } else { "Pause BlueKey" }, true, None::<&str>)?;
    
    // Window controls
    let show_i = MenuItem::with_id(app, "show", if is_zh { "打开 BlueKey" } else { "Open BlueKey" }, true, None::<&str>)?;
    let settings_i = MenuItem::with_id(app, "settings", if is_zh { "设置" } else { "Settings" }, true, None::<&str>)?;
    
    // Quit
    let quit_i = MenuItem::with_id(app, "quit", if is_zh { "退出" } else { "Quit" }, true, None::<&str>)?;
    
    let separator = PredefinedMenuItem::separator(app)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    
    let menu = Menu::with_items(app, &[
        &header_i,
        &device_info_i,
        &separator,
        &status_i,
        &lock_i,
        &toggle_monitor_i,
        &separator2,
        &show_i,
        &settings_i,
        &separator3,
        &quit_i,
    ])?;
    
    let tooltip = if is_zh { "BlueKey - 蓝牙智能解锁" } else { "BlueKey - Bluetooth Smart Unlock" };
    
    // Remove existing tray if any
    let _ = app.remove_tray_by_id("main");
    
    let _tray = TrayIconBuilder::with_id("main")
        .icon(tauri::include_image!("./icons/tray-gray.png"))
        .menu(&menu)
        .show_menu_on_left_click(true)
        .tooltip(tooltip)
        .on_menu_event(|app, event| {
            let app = app.clone();
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        #[cfg(target_os = "macos")]
                        {
                            let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
                        }
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "settings" => {
                    if let Some(window) = app.get_webview_window("main") {
                        #[cfg(target_os = "macos")]
                        {
                            let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
                        }
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.emit("navigate", "settings");
                    }
                }
                "toggle_monitor" => {
                    let monitor = app.state::<MonitorWrapper>().0.clone();
                    let storage = app.state::<StorageWrapper>().0.clone();
                    let app_clone = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let monitor_locked = monitor.lock().await;
                        let is_running = monitor_locked.is_running().await;
                        drop(monitor_locked);
                        
                        if is_running {
                            let monitor_locked = monitor.lock().await;
                            monitor_locked.stop().await;
                            update_tray_icon_state(&app_clone, false);
                        } else {
                            let storage = storage.lock().await;
                            let paired_devices = storage.get_paired_devices().await;
                            let settings = storage.get_settings().await;
                            drop(storage);
                            
                            let monitor_locked = monitor.lock().await;
                            monitor_locked.update_paired_devices(paired_devices).await;
                            monitor_locked.update_settings(settings).await;
                            let _ = monitor_locked.start().await;
                            update_tray_icon_state(&app_clone, true);
                        }
                    });
                }
                "lock" => {
                    let controller = app.state::<SystemControllerWrapper>().0.clone();
                    tauri::async_runtime::spawn(async move {
                        let controller = controller.lock().await;
                        let _ = controller.lock_screen().await;
                    });
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;
    
    Ok(())
}
