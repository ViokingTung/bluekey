//! Device storage and persistence module

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};

use super::device::{BluetoothDevice, DeviceType};

/// Configuration for a paired device
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairedDevice {
    /// Device unique identifier
    pub id: String,
    /// Device name
    pub name: String,
    /// Device type
    pub device_type: DeviceType,
    /// Whether the device is enabled for unlock
    pub enabled: bool,
    /// Priority for unlock (higher = more priority)
    pub priority: u8,
    /// Detection range in meters
    pub unlock_range: f64,
    /// Lock range in meters
    pub lock_range: f64,
    /// Time added
    pub added_at: u64,
    /// Last seen timestamp
    pub last_seen: Option<u64>,
    /// Calibration data
    pub calibration: Option<CalibrationData>,
}

impl PairedDevice {
    /// Create a new paired device from a discovered device
    pub fn from_bluetooth_device(device: &BluetoothDevice) -> Self {
        PairedDevice {
            id: device.id.clone(),
            name: device.name.clone(),
            device_type: device.device_type,
            enabled: true,
            priority: 50,
            unlock_range: 3.0,
            lock_range: 5.0,
            added_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            last_seen: None,
            calibration: None,
        }
    }
}

/// Calibration data for distance estimation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalibrationData {
    /// Reference RSSI at 1 meter
    pub rssi_1m: f64,
    /// Path loss exponent
    pub path_loss_exponent: f64,
    /// Number of calibration samples
    pub samples: u32,
}

impl Default for CalibrationData {
    fn default() -> Self {
        CalibrationData {
            rssi_1m: -59.0,
            path_loss_exponent: 2.0,
            samples: 0,
        }
    }
}

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// Default unlock range in meters
    pub default_unlock_range: f64,
    /// Default lock range in meters
    pub default_lock_range: f64,
    /// Unlock delay in seconds
    pub unlock_delay: u64,
    /// Lock delay in seconds
    pub lock_delay: u64,
    /// Scan interval in seconds
    pub scan_interval: u64,
    /// Enable notifications
    pub notifications_enabled: bool,
    /// Auto-start on login
    pub auto_start: bool,
    /// Language setting: "system", "zh-CN", "en-US"
    #[serde(default = "default_language")]
    pub language: String,
}

fn default_language() -> String {
    "system".to_string()
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            default_unlock_range: 3.0,
            default_lock_range: 5.0,
            unlock_delay: 1,
            lock_delay: 5,
            scan_interval: 2,
            notifications_enabled: true,
            auto_start: true,
            language: default_language(),
        }
    }
}

/// Device storage manager
pub struct DeviceStorage {
    /// Path to storage file
    storage_path: PathBuf,
    /// Paired devices
    paired_devices: Arc<RwLock<HashMap<String, PairedDevice>>>,
    /// Application settings
    settings: Arc<RwLock<AppSettings>>,
}

impl DeviceStorage {
    /// Create a new device storage
    pub fn new(app_data_dir: PathBuf) -> Self {
        let storage_path = app_data_dir.join("bluekey_data.json");
        
        let storage = DeviceStorage {
            storage_path,
            paired_devices: Arc::new(RwLock::new(HashMap::new())),
            settings: Arc::new(RwLock::new(AppSettings::default())),
        };
        
        // Load existing data
        // Note: load() should be called separately in async context
        
        storage
    }
    
    /// Load data from storage file
    pub async fn load(&self) -> Result<(), StorageError> {
        if !self.storage_path.exists() {
            debug!("Storage file does not exist, creating new");
            self.save().await?;
            return Ok(());
        }
        
        let content = tokio::fs::read_to_string(&self.storage_path).await
            .map_err(|e| StorageError::IoError(e.to_string()))?;
        
        let data: StorageData = serde_json::from_str(&content)
            .map_err(|e| StorageError::ParseError(e.to_string()))?;
        
        let device_count = data.paired_devices.len();
        
        {
            let mut devices = self.paired_devices.write().await;
            *devices = data.paired_devices;
        }
        
        {
            let mut settings = self.settings.write().await;
            *settings = data.settings;
        }
        
        info!("Loaded {} paired devices from storage", device_count);
        Ok(())
    }
    
    /// Save data to storage file
    pub async fn save(&self) -> Result<(), StorageError> {
        // Ensure parent directory exists
        if let Some(parent) = self.storage_path.parent() {
            tokio::fs::create_dir_all(parent).await
                .map_err(|e| StorageError::IoError(e.to_string()))?;
        }
        
        let data = StorageData {
            paired_devices: self.paired_devices.read().await.clone(),
            settings: self.settings.read().await.clone(),
        };
        
        let content = serde_json::to_string_pretty(&data)
            .map_err(|e| StorageError::ParseError(e.to_string()))?;
        
        tokio::fs::write(&self.storage_path, content).await
            .map_err(|e| StorageError::IoError(e.to_string()))?;
        
        debug!("Saved data to storage");
        Ok(())
    }
    
    /// Add a paired device
    pub async fn add_device(&self, device: BluetoothDevice) -> Result<PairedDevice, StorageError> {
        let paired = PairedDevice::from_bluetooth_device(&device);
        
        {
            let mut devices = self.paired_devices.write().await;
            devices.insert(paired.id.clone(), paired.clone());
        }
        
        self.save().await?;
        info!("Added paired device: {} ({})", paired.name, paired.id);
        Ok(paired)
    }
    
    /// Remove a paired device
    pub async fn remove_device(&self, id: &str) -> Result<(), StorageError> {
        {
            let mut devices = self.paired_devices.write().await;
            devices.remove(id);
        }
        
        self.save().await?;
        info!("Removed paired device: {}", id);
        Ok(())
    }
    
    /// Update a paired device
    pub async fn update_device(&self, device: PairedDevice) -> Result<(), StorageError> {
        {
            let mut devices = self.paired_devices.write().await;
            devices.insert(device.id.clone(), device);
        }
        
        self.save().await?;
        Ok(())
    }
    
    /// Get all paired devices
    pub async fn get_paired_devices(&self) -> Vec<PairedDevice> {
        self.paired_devices.read().await.values().cloned().collect()
    }
    
    /// Get a specific paired device
    pub async fn get_paired_device(&self, id: &str) -> Option<PairedDevice> {
        self.paired_devices.read().await.get(id).cloned()
    }
    
    /// Check if a device is paired
    pub async fn is_paired(&self, id: &str) -> bool {
        self.paired_devices.read().await.contains_key(id)
    }
    
    /// Get settings
    pub async fn get_settings(&self) -> AppSettings {
        self.settings.read().await.clone()
    }
    
    /// Update settings
    pub async fn update_settings(&self, settings: AppSettings) -> Result<(), StorageError> {
        {
            let mut current = self.settings.write().await;
            *current = settings;
        }
        
        self.save().await?;
        Ok(())
    }
    
    /// Update device last seen timestamp
    #[allow(dead_code)]
    pub async fn update_last_seen(&self, id: &str) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        let mut devices = self.paired_devices.write().await;
        if let Some(device) = devices.get_mut(id) {
            device.last_seen = Some(now);
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct StorageData {
    paired_devices: HashMap<String, PairedDevice>,
    settings: AppSettings,
}

/// Storage error types
#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    IoError(String),
    #[error("Parse error: {0}")]
    ParseError(String),
}
