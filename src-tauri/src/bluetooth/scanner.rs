//! Bluetooth scanner implementation

use btleplug::api::{Central, CentralEvent, Manager, Peripheral, ScanFilter};
use btleplug::platform::Manager as PlatformManager;
use btleplug::Error as BtleplugError;
use futures::stream::StreamExt;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, Mutex, RwLock};
use tracing::{debug, error, info};

use super::device::BluetoothDevice;

/// Result type for scanner operations
pub type ScanResult<T> = Result<T, ScannerError>;

/// Scanner error types
#[derive(Debug, thiserror::Error)]
pub enum ScannerError {
    #[error("Bluetooth adapter not found")]
    AdapterNotFound,
    #[error("Failed to start scan: {0}")]
    ScanFailed(String),
    #[error("Bluetooth error: {0}")]
    BluetoothError(#[from] BtleplugError),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// Bluetooth scanner state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum ScannerState {
    Idle,
    Scanning,
    Error,
}

/// Bluetooth scanner for discovering nearby devices
pub struct BluetoothScanner {
    /// Discovered devices
    devices: Arc<RwLock<HashMap<String, BluetoothDevice>>>,
    /// Current scanner state
    state: Arc<Mutex<ScannerState>>,
    /// Event sender for device updates
    event_sender: broadcast::Sender<ScannerEvent>,
}

/// Events emitted by the scanner
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum ScannerEvent {
    /// New device discovered
    DeviceDiscovered(BluetoothDevice),
    /// Device updated (RSSI change)
    DeviceUpdated(BluetoothDevice),
    /// Device lost (timeout or out of range)
    DeviceLost(String),
    /// Scanner state changed
    StateChanged(ScannerState),
    /// Scan error occurred
    Error(String),
}

impl BluetoothScanner {
    /// Create a new Bluetooth scanner
    pub fn new() -> Self {
        let (event_sender, _) = broadcast::channel(100);
        
        BluetoothScanner {
            devices: Arc::new(RwLock::new(HashMap::new())),
            state: Arc::new(Mutex::new(ScannerState::Idle)),
            event_sender,
        }
    }
    
    /// Subscribe to scanner events
    #[allow(dead_code)]
    pub fn subscribe(&self) -> broadcast::Receiver<ScannerEvent> {
        self.event_sender.subscribe()
    }

    /// Get current scanner state
    pub async fn state(&self) -> ScannerState {
        *self.state.lock().await
    }

    /// Get all discovered devices
    pub async fn get_devices(&self) -> Vec<BluetoothDevice> {
        let devices = self.devices.read().await;
        devices.values().cloned().collect()
    }

    /// Get a specific device by ID
    #[allow(dead_code)]
    pub async fn get_device(&self, id: &str) -> Option<BluetoothDevice> {
        let devices = self.devices.read().await;
        devices.get(id).cloned()
    }
    
    /// Start scanning for Bluetooth devices
    pub async fn start_scan(&self, duration: Option<Duration>) -> ScanResult<()> {
        let manager = PlatformManager::new().await.map_err(|e| {
            error!("Failed to create Bluetooth manager: {}", e);
            e
        })?;
        let adapters = manager.adapters().await.map_err(|e| {
            error!("Failed to get Bluetooth adapters: {}", e);
            e
        })?;

        let adapter = adapters
            .into_iter()
            .next()
            .ok_or_else(|| {
                error!("No Bluetooth adapter found");
                ScannerError::AdapterNotFound
            })?;

        // Update state
        {
            let mut state = self.state.lock().await;
            *state = ScannerState::Scanning;
        }
        let _ = self.event_sender.send(ScannerEvent::StateChanged(ScannerState::Scanning));

        info!("Starting Bluetooth scan...");

        // Start scanning
        adapter
            .start_scan(ScanFilter::default())
            .await
            .map_err(|e| {
                error!("Failed to start scan: {}", e);
                ScannerError::ScanFailed(e.to_string())
            })?;

        // Subscribe to events
        let mut events = adapter.events().await.map_err(|e| {
            error!("Failed to subscribe to adapter events: {}", e);
            e
        })?;

        // Clone references for async task
        let devices = self.devices.clone();
        let state = self.state.clone();
        let event_sender = self.event_sender.clone();
        let adapter_clone = adapter.clone();

        // Spawn scan task
        tokio::spawn(async move {
            let scan_duration = duration.unwrap_or(Duration::from_secs(30));
            let timeout = tokio::time::sleep(scan_duration);
            let mut discovered_count = 0u32;

            tokio::pin!(timeout);

            loop {
                tokio::select! {
                    // Handle timeout
                    _ = &mut timeout => {
                        info!("Scan duration completed, found {} devices", discovered_count);
                        break;
                    }

                    // Handle Bluetooth events
                    Some(event) = events.next() => {
                        match event {
                            CentralEvent::DeviceDiscovered(id) => {
                                debug!("Device discovered: {}", id);
                                if let Ok(peripheral) = adapter_clone.peripheral(&id).await {
                                    if let Ok(Some(properties)) = peripheral.properties().await {
                                        let device = BluetoothDevice::new(
                                            id.to_string(),
                                            properties.local_name,
                                            properties.rssi,
                                        );

                                        info!("Found device: {} (RSSI: {:?}, Type: {:?})", device.name, device.rssi, device.device_type);
                                        discovered_count += 1;

                                        // Store device
                                        {
                                            let mut devices_lock = devices.write().await;
                                            devices_lock.insert(device.id.clone(), device.clone());
                                        }

                                        // Send event
                                        let _ = event_sender.send(ScannerEvent::DeviceDiscovered(device));
                                    }
                                }
                            }

                            CentralEvent::DeviceUpdated(id) => {
                                debug!("Device updated: {}", id);
                                if let Ok(peripheral) = adapter_clone.peripheral(&id).await {
                                    if let Ok(Some(properties)) = peripheral.properties().await {
                                        let device = BluetoothDevice::new(
                                            id.to_string(),
                                            properties.local_name,
                                            properties.rssi,
                                        );

                                        // Update device
                                        {
                                            let mut devices_lock = devices.write().await;
                                            devices_lock.insert(device.id.clone(), device.clone());
                                        }

                                        // Send event
                                        let _ = event_sender.send(ScannerEvent::DeviceUpdated(device));
                                    }
                                }
                            }

                            _ => {}
                        }
                    }
                }
            }

            // Stop scanning
            if let Err(e) = adapter_clone.stop_scan().await {
                error!("Failed to stop scan: {}", e);
            }

            // Update state
            {
                let mut state_lock = state.lock().await;
                *state_lock = ScannerState::Idle;
            }
            let _ = event_sender.send(ScannerEvent::StateChanged(ScannerState::Idle));

            info!("Bluetooth scan completed, total devices found: {}", discovered_count);
        });

        Ok(())
    }
    
    /// Stop scanning
    pub async fn stop_scan(&self) -> ScanResult<()> {
        let manager = PlatformManager::new().await?;
        let adapters = manager.adapters().await?;
        
        if let Some(adapter) = adapters.into_iter().next() {
            adapter.stop_scan().await?;
            
            let mut state = self.state.lock().await;
            *state = ScannerState::Idle;
            let _ = self.event_sender.send(ScannerEvent::StateChanged(ScannerState::Idle));
        }
        
        Ok(())
    }
    
    /// Clear all discovered devices
    pub async fn clear_devices(&self) {
        let mut devices = self.devices.write().await;
        devices.clear();
    }
}

impl Default for BluetoothScanner {
    fn default() -> Self {
        Self::new()
    }
}
