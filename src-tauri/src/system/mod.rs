//! System control module for lock/unlock operations
//!
//! Provides cross-platform system lock screen functionality and proximity monitoring

mod controller;
mod monitor;

#[allow(unused_imports)]
pub use controller::{LockState, SystemController, SystemError};
#[allow(unused_imports)]
pub use monitor::{MonitorEvent, MonitorError, ProximityMonitor};
