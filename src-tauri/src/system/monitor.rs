//! Proximity monitor service for automatic lock/unlock

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{broadcast, Mutex, RwLock};
use tracing::{debug, error, info};

use crate::bluetooth::{
    AppSettings, BluetoothScanner, DistanceEstimator,
    PairedDevice, ProximityStatus,
};
use crate::system::{LockState, SystemController};

/// Monitor event for notifying UI
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum MonitorEvent {
    /// Device proximity changed
    DeviceProximityChanged {
        device_id: String,
        distance: f64,
        status: ProximityStatus,
    },
    /// Lock state changed
    LockStateChanged(LockState),
    /// Auto-lock triggered
    AutoLockTriggered { reason: String },
    /// Auto-unlock triggered
    AutoUnlockTriggered { device_name: String },
    /// Error occurred
    Error(String),
}

/// Device tracking state
#[derive(Debug, Clone)]
struct DeviceTracker {
    /// Last known distance
    last_distance: Option<f64>,
    /// Last seen timestamp
    last_seen: Instant,
    /// Consecutive in-range readings for unlock
    in_range_count: u32,
    /// Consecutive out-of-range readings for lock
    out_of_range_count: u32,
}

impl Default for DeviceTracker {
    fn default() -> Self {
        DeviceTracker {
            last_distance: None,
            last_seen: Instant::now(),
            in_range_count: 0,
            out_of_range_count: 0,
        }
    }
}

/// Proximity monitor service
pub struct ProximityMonitor {
    /// Bluetooth scanner
    scanner: Arc<Mutex<BluetoothScanner>>,
    /// Distance estimator
    estimator: Arc<Mutex<DistanceEstimator>>,
    /// System controller
    controller: Arc<Mutex<SystemController>>,
    /// Paired devices
    paired_devices: Arc<RwLock<HashMap<String, PairedDevice>>>,
    /// Device trackers
    trackers: Arc<Mutex<HashMap<String, DeviceTracker>>>,
    /// Application settings
    settings: Arc<RwLock<AppSettings>>,
    /// Event broadcaster
    event_sender: broadcast::Sender<MonitorEvent>,
    /// Monitor running state
    running: Arc<Mutex<bool>>,
}

impl ProximityMonitor {
    /// Create a new proximity monitor
    pub fn new(
        scanner: Arc<Mutex<BluetoothScanner>>,
        estimator: Arc<Mutex<DistanceEstimator>>,
        controller: Arc<Mutex<SystemController>>,
    ) -> Self {
        let (event_sender, _) = broadcast::channel(100);
        
        ProximityMonitor {
            scanner,
            estimator,
            controller,
            paired_devices: Arc::new(RwLock::new(HashMap::new())),
            trackers: Arc::new(Mutex::new(HashMap::new())),
            settings: Arc::new(RwLock::new(AppSettings::default())),
            event_sender,
            running: Arc::new(Mutex::new(false)),
        }
    }
    
    /// Subscribe to monitor events
    #[allow(dead_code)]
    pub fn subscribe(&self) -> broadcast::Receiver<MonitorEvent> {
        self.event_sender.subscribe()
    }
    
    /// Update paired devices
    pub async fn update_paired_devices(&self, devices: Vec<PairedDevice>) {
        let mut paired = self.paired_devices.write().await;
        paired.clear();
        for device in devices {
            if device.enabled {
                paired.insert(device.id.clone(), device);
            }
        }
        debug!("Updated paired devices: {} enabled", paired.len());
    }
    
    /// Update settings
    pub async fn update_settings(&self, settings: AppSettings) {
        let mut current = self.settings.write().await;
        *current = settings;
    }
    
    /// Start monitoring, returns true if actually started, false if already running
    pub async fn start(&self) -> Result<bool, MonitorError> {
        let mut running = self.running.lock().await;
        if *running {
            return Ok(false);
        }
        *running = true;
        drop(running);
        
        info!("Starting proximity monitor");
        
        // Start continuous Bluetooth scan
        let scanner = self.scanner.lock().await;
        scanner.start_scan(None).await.map_err(|e| MonitorError::ScanError(e.to_string()))?;
        drop(scanner);
        
        // Spawn monitor loop
        let scanner = self.scanner.clone();
        let estimator = self.estimator.clone();
        let controller = self.controller.clone();
        let paired_devices = self.paired_devices.clone();
        let trackers = self.trackers.clone();
        let settings = self.settings.clone();
        let event_sender = self.event_sender.clone();
        let running = self.running.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(1));
            
            loop {
                interval.tick().await;
                
                // Check if still running
                if !*running.lock().await {
                    break;
                }
                
                // Get discovered devices
                let devices = {
                    let scanner = scanner.lock().await;
                    scanner.get_devices().await
                };
                
                // Get paired devices
                let paired = paired_devices.read().await.clone();
                
                if paired.is_empty() {
                    continue;
                }
                
                // Process each paired device
                let mut any_in_range = false;
                let mut trackers_lock = trackers.lock().await;
                let settings_lock = settings.read().await;
                
                for (id, paired_device) in &paired {
                    // Find discovered device
                    let discovered = devices.iter().find(|d| d.id == *id);
                    
                    let tracker = trackers_lock.entry(id.clone()).or_insert_with(DeviceTracker::default);
                    
                    if let Some(device) = discovered {
                        if let Some(rssi) = device.rssi {
                            // Estimate distance
                            let estimator_lock = estimator.lock().await;
                            let distance = estimator_lock.estimate_distance(id, rssi).await;
                            drop(estimator_lock);
                            
                            tracker.last_distance = Some(distance);
                            tracker.last_seen = Instant::now();
                            
                            // Determine proximity status
                            let status = if distance <= paired_device.unlock_range {
                                tracker.in_range_count += 1;
                                tracker.out_of_range_count = 0;
                                ProximityStatus::InRange
                            } else if distance <= paired_device.lock_range {
                                tracker.in_range_count = 0;
                                tracker.out_of_range_count = 0;
                                ProximityStatus::NearRange
                            } else {
                                tracker.in_range_count = 0;
                                tracker.out_of_range_count += 1;
                                ProximityStatus::OutOfRange
                            };
                            
                            // Send event
                            let _ = event_sender.send(MonitorEvent::DeviceProximityChanged {
                                device_id: id.clone(),
                                distance,
                                status,
                            });
                            
                            // Check for unlock trigger
                            let unlock_threshold = settings_lock.unlock_delay as u32;
                            if tracker.in_range_count >= unlock_threshold.max(1) {
                                any_in_range = true;
                                
                                // Trigger unlock if system is locked
                                let controller_lock = controller.lock().await;
                                if controller_lock.is_locked().await {
                                    info!("Auto-unlock triggered by device: {}", paired_device.name);
                                    let _ = event_sender.send(MonitorEvent::AutoUnlockTriggered {
                                        device_name: paired_device.name.clone(),
                                    });
                                    // Note: Actual unlock requires user authentication
                                    // We just wake the screen and prepare for unlock
                                }
                            }
                        }
                    } else {
                        // Device not seen, increment out of range
                        tracker.out_of_range_count += 1;
                        tracker.in_range_count = 0;
                    }
                }
                
                drop(trackers_lock);
                
                // Check for auto-lock trigger
                if !any_in_range {
                    let all_out_of_range = {
                        let trackers_lock = trackers.lock().await;
                        trackers_lock.values().all(|t| {
                            t.out_of_range_count >= settings_lock.lock_delay as u32
                        })
                    };
                    
                    if all_out_of_range && !paired.is_empty() {
                        let controller_lock = controller.lock().await;
                        if !controller_lock.is_locked().await {
                            info!("Auto-lock triggered: all devices out of range");
                            let _ = event_sender.send(MonitorEvent::AutoLockTriggered {
                                reason: "All paired devices out of range".to_string(),
                            });
                            
                            if let Err(e) = controller_lock.lock_screen().await {
                                error!("Failed to lock screen: {}", e);
                                let _ = event_sender.send(MonitorEvent::Error(e.to_string()));
                            }
                        }
                    }
                }
            }
        });

        Ok(true)
    }
    
    /// Stop monitoring
    pub async fn stop(&self) {
        let mut running = self.running.lock().await;
        *running = false;
        
        // Stop Bluetooth scan
        let scanner = self.scanner.lock().await;
        let _ = scanner.stop_scan().await;
        
        info!("Proximity monitor stopped");
    }
    
    /// Check if monitor is running
    pub async fn is_running(&self) -> bool {
        *self.running.lock().await
    }
    
    /// Get device distances
    pub async fn get_device_distances(&self) -> HashMap<String, Option<f64>> {
        let trackers = self.trackers.lock().await;
        trackers
            .iter()
            .map(|(id, tracker)| (id.clone(), tracker.last_distance))
            .collect()
    }
}

/// Monitor error types
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum MonitorError {
    #[error("Scan error: {0}")]
    ScanError(String),
    #[error("Monitor error: {0}")]
    MonitorError(String),
}
