//! Bluetooth device data structures

use serde::{Deserialize, Serialize};

/// Device type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeviceType {
    Phone,
    Watch,
    Band,
    Headphones,
    Speaker,
    Keyboard,
    Mouse,
    Other,
}

impl DeviceType {
    /// Try to determine device type from device name
    pub fn from_name(name: &str) -> Self {
        let name_lower = name.to_lowercase();
        
        if name_lower.contains("watch") || name_lower.contains("watch") {
            DeviceType::Watch
        } else if name_lower.contains("band") 
            || name_lower.contains("mi band") 
            || name_lower.contains("fitbit")
            || name_lower.contains("huami") {
            DeviceType::Band
        } else if name_lower.contains("iphone") 
            || name_lower.contains("android")
            || name_lower.contains("pixel")
            || name_lower.contains("galaxy s")
            || name_lower.contains("phone") {
            DeviceType::Phone
        } else if name_lower.contains("airpods") 
            || name_lower.contains("headphone")
            || name_lower.contains("earbuds") {
            DeviceType::Headphones
        } else if name_lower.contains("speaker") {
            DeviceType::Speaker
        } else if name_lower.contains("keyboard") || name_lower.contains("kbd") {
            DeviceType::Keyboard
        } else if name_lower.contains("mouse") {
            DeviceType::Mouse
        } else {
            DeviceType::Other
        }
    }
}

/// Bluetooth device information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BluetoothDevice {
    /// Unique device identifier (MAC address or UUID)
    pub id: String,
    /// Device name (may be empty for some devices)
    pub name: String,
    /// Device type classification
    pub device_type: DeviceType,
    /// Signal strength in dBm (typically -100 to -30)
    pub rssi: Option<i16>,
    /// Whether the device is currently connected
    pub connected: bool,
    /// Estimated distance in meters (based on RSSI)
    pub distance: Option<f64>,
}

impl BluetoothDevice {
    /// Create a new Bluetooth device from btleplug Peripheral
    pub fn new(id: String, name: Option<String>, rssi: Option<i16>) -> Self {
        let device_name = name.unwrap_or_else(|| "Unknown Device".to_string());
        let device_type = DeviceType::from_name(&device_name);
        let distance = rssi.map(|r| Self::calculate_distance(r));
        
        BluetoothDevice {
            id,
            name: device_name,
            device_type,
            rssi,
            connected: false,
            distance,
        }
    }
    
    /// Calculate approximate distance from RSSI value
    /// Using the log-distance path loss model
    fn calculate_distance(rssi: i16) -> f64 {
        // Reference RSSI at 1 meter (typical value for BLE devices)
        const RSSI_1M: f64 = -59.0;
        // Path loss exponent (2 for free space, higher for indoor)
        const PATH_LOSS_EXPONENT: f64 = 2.0;
        
        let rssi_f64 = rssi as f64;
        let ratio = (RSSI_1M - rssi_f64) / (10.0 * PATH_LOSS_EXPONENT);
        10f64.powf(ratio)
    }
    
    /// Update RSSI and recalculate distance
    #[allow(dead_code)]
    pub fn update_rssi(&mut self, rssi: i16) {
        self.rssi = Some(rssi);
        self.distance = Some(Self::calculate_distance(rssi));
    }
}
