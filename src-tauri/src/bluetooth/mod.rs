//! Bluetooth module for device scanning and management

mod device;
mod distance;
mod scanner;
mod storage;

pub use device::BluetoothDevice;
#[allow(unused_imports)]
pub use distance::{DistanceEstimator, KalmanFilter, ProximityDetector, ProximityStatus};
#[allow(unused_imports)]
pub use scanner::{BluetoothScanner, ScannerState};
pub use storage::{AppSettings, CalibrationData, DeviceStorage, PairedDevice};
