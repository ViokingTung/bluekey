//! Distance estimation module with Kalman filter for RSSI smoothing

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::storage::CalibrationData;

/// Kalman filter for RSSI smoothing
#[derive(Debug, Clone)]
pub struct KalmanFilter {
    /// Process noise covariance
    process_noise: f64,
    /// Measurement noise covariance
    measurement_noise: f64,
    /// Estimated error covariance
    estimate_error: f64,
    /// Last estimated value
    last_estimate: f64,
    /// Whether the filter has been initialized
    initialized: bool,
}

impl KalmanFilter {
    /// Create a new Kalman filter
    pub fn new(process_noise: f64, measurement_noise: f64) -> Self {
        KalmanFilter {
            process_noise,
            measurement_noise,
            estimate_error: 1.0,
            last_estimate: 0.0,
            initialized: false,
        }
    }
    
    /// Initialize the filter with a starting value
    pub fn initialize(&mut self, initial_value: f64) {
        self.last_estimate = initial_value;
        self.initialized = true;
    }
    
    /// Update the filter with a new measurement
    pub fn update(&mut self, measurement: f64) -> f64 {
        if !self.initialized {
            self.initialize(measurement);
            return measurement;
        }
        
        // Prediction step
        let predicted_error = self.estimate_error + self.process_noise;
        
        // Update step
        let kalman_gain = predicted_error / (predicted_error + self.measurement_noise);
        let estimate = self.last_estimate + kalman_gain * (measurement - self.last_estimate);
        self.estimate_error = (1.0 - kalman_gain) * predicted_error;
        
        self.last_estimate = estimate;
        estimate
    }
    
    /// Get the current estimate
    #[allow(dead_code)]
    pub fn get_estimate(&self) -> f64 {
        self.last_estimate
    }
    
    /// Reset the filter
    pub fn reset(&mut self) {
        self.estimate_error = 1.0;
        self.last_estimate = 0.0;
        self.initialized = false;
    }
}

impl Default for KalmanFilter {
    fn default() -> Self {
        Self::new(0.01, 0.1)
    }
}

/// Distance estimator with device-specific calibration
pub struct DistanceEstimator {
    /// Kalman filters per device
    filters: Arc<RwLock<HashMap<String, KalmanFilter>>>,
    /// Default calibration
    default_calibration: CalibrationData,
    /// Device-specific calibrations
    calibrations: Arc<RwLock<HashMap<String, CalibrationData>>>,
}

impl DistanceEstimator {
    /// Create a new distance estimator
    pub fn new() -> Self {
        DistanceEstimator {
            filters: Arc::new(RwLock::new(HashMap::new())),
            default_calibration: CalibrationData::default(),
            calibrations: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Set calibration for a device
    pub async fn set_calibration(&self, device_id: &str, calibration: CalibrationData) {
        let mut calibrations = self.calibrations.write().await;
        calibrations.insert(device_id.to_string(), calibration);
    }
    
    /// Get calibration for a device
    async fn get_calibration(&self, device_id: &str) -> CalibrationData {
        let calibrations = self.calibrations.read().await;
        calibrations.get(device_id).cloned().unwrap_or_else(|| self.default_calibration.clone())
    }
    
    /// Estimate distance from RSSI with Kalman filtering
    pub async fn estimate_distance(&self, device_id: &str, rssi: i16) -> f64 {
        // Apply Kalman filter to smooth RSSI
        let smoothed_rssi = {
            let mut filters = self.filters.write().await;
            let filter = filters.entry(device_id.to_string())
                .or_insert_with(KalmanFilter::default);
            filter.update(rssi as f64)
        };
        
        // Get calibration data
        let calibration = self.get_calibration(device_id).await;
        
        // Calculate distance using log-distance path loss model
        // d = 10 ^ ((RSSI_1m - RSSI) / (10 * n))
        let ratio = (calibration.rssi_1m - smoothed_rssi) / (10.0 * calibration.path_loss_exponent);
        10f64.powf(ratio)
    }
    
    /// Reset filter for a device
    pub async fn reset_filter(&self, device_id: &str) {
        let mut filters = self.filters.write().await;
        if let Some(filter) = filters.get_mut(device_id) {
            filter.reset();
        }
    }
    
    /// Reset all filters
    #[allow(dead_code)]
    pub async fn reset_all_filters(&self) {
        let mut filters = self.filters.write().await;
        filters.clear();
    }
    
    /// Perform calibration at a known distance
    pub async fn calibrate_at_distance(
        &self,
        device_id: &str,
        distance: f64,
        rssi_samples: Vec<i16>,
    ) -> CalibrationData {
        if rssi_samples.is_empty() {
            return self.get_calibration(device_id).await;
        }
        
        // Calculate average RSSI
        let avg_rssi: f64 = rssi_samples.iter().map(|&r| r as f64).sum::<f64>() / rssi_samples.len() as f64;
        
        // Calculate RSSI at 1 meter using log-distance model
        // RSSI_1m = RSSI_d + 10 * n * log10(d)
        // Assuming n = 2.0 for free space
        let path_loss = 2.0;
        let rssi_1m = avg_rssi + 10.0 * path_loss * distance.log10();
        
        let calibration = CalibrationData {
            rssi_1m,
            path_loss_exponent: path_loss,
            samples: rssi_samples.len() as u32,
        };
        
        self.set_calibration(device_id, calibration.clone()).await;
        
        calibration
    }
    
    /// Get current RSSI estimate for a device
    #[allow(dead_code)]
    pub async fn get_rssi_estimate(&self, device_id: &str) -> Option<f64> {
        let filters = self.filters.read().await;
        filters.get(device_id).map(|f| f.get_estimate())
    }
}

impl Default for DistanceEstimator {
    fn default() -> Self {
        Self::new()
    }
}

/// Device proximity status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProximityStatus {
    /// Device is within unlock range
    InRange,
    /// Device is between unlock and lock range
    NearRange,
    /// Device is outside lock range
    OutOfRange,
    /// Device status unknown (no recent data)
    Unknown,
}

/// Proximity detector for managing unlock/lock logic
#[allow(dead_code)]
pub struct ProximityDetector {
    /// Distance estimator
    estimator: Arc<DistanceEstimator>,
    /// Device distances
    distances: Arc<RwLock<HashMap<String, f64>>>,
}

impl ProximityDetector {
    /// Create a new proximity detector
    #[allow(dead_code)]
    pub fn new(estimator: Arc<DistanceEstimator>) -> Self {
        ProximityDetector {
            estimator,
            distances: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Update device distance and return proximity status
    #[allow(dead_code)]
    pub async fn update_distance(
        &self,
        device_id: &str,
        rssi: i16,
        unlock_range: f64,
        lock_range: f64,
    ) -> (f64, ProximityStatus) {
        let distance = self.estimator.estimate_distance(device_id, rssi).await;
        
        // Store distance
        {
            let mut distances = self.distances.write().await;
            distances.insert(device_id.to_string(), distance);
        }
        
        // Determine proximity status
        let status = if distance <= unlock_range {
            ProximityStatus::InRange
        } else if distance <= lock_range {
            ProximityStatus::NearRange
        } else {
            ProximityStatus::OutOfRange
        };
        
        (distance, status)
    }
    
    /// Get current distance for a device
    #[allow(dead_code)]
    pub async fn get_distance(&self, device_id: &str) -> Option<f64> {
        let distances = self.distances.read().await;
        distances.get(device_id).copied()
    }

    /// Get all device distances
    #[allow(dead_code)]
    pub async fn get_all_distances(&self) -> HashMap<String, f64> {
        self.distances.read().await.clone()
    }

    /// Check if any paired device is in range
    #[allow(dead_code)]
    pub async fn has_device_in_range(
        &self,
        paired_devices: &[(String, f64, f64)], // (device_id, unlock_range, lock_range)
    ) -> bool {
        let distances = self.distances.read().await;
        
        for (device_id, unlock_range, _lock_range) in paired_devices {
            if let Some(&distance) = distances.get(device_id) {
                if distance <= *unlock_range {
                    return true;
                }
            }
        }
        
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kalman_filter_initialization() {
        let filter = KalmanFilter::new(0.1, 0.5);
        
        assert!(!filter.initialized);
        assert_eq!(filter.last_estimate, 0.0);
        assert_eq!(filter.estimate_error, 1.0);
    }

    #[test]
    fn test_kalman_filter_update() {
        let mut filter = KalmanFilter::new(0.1, 0.5);
        
        // First update initializes the filter
        let result1 = filter.update(-60.0);
        assert_eq!(result1, -60.0);
        assert!(filter.initialized);
        
        // Second update should be smoother
        let result2 = filter.update(-59.0);
        assert!(result2.is_finite());
        
        // Results should be similar after multiple updates
        let result3 = filter.update(-61.0);
        assert!(result3.is_finite());
    }

    #[test]
    fn test_kalman_filter_stability() {
        let mut filter = KalmanFilter::new(0.1, 0.5);
        
        // Simulate noisy RSSI values
        let rssi_values = vec![-60, -59, -61, -58, -62, -60, -59, -61];
        let mut results = Vec::new();
        
        for rssi in rssi_values {
            results.push(filter.update(rssi as f64));
        }
        
        // Results should stabilize
        let variance: f64 = {
            let mean = results.iter().sum::<f64>() / results.len() as f64;
            results.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / results.len() as f64
        };
        
        // Variance should be relatively low after filtering
        assert!(variance < 10.0);
    }

    #[tokio::test]
    async fn test_distance_estimator_default() {
        let estimator = DistanceEstimator::new();
        
        // At -59 dBm (1m reference), distance should be ~1m
        let distance = estimator.estimate_distance("test-device", -59).await;
        assert!((distance - 1.0).abs() < 0.5);
        
        // At -69 dBm, distance should be ~3.16m (log-distance model)
        let distance = estimator.estimate_distance("test-device", -69).await;
        assert!(distance > 2.0 && distance < 5.0);
    }

    #[tokio::test]
    async fn test_distance_estimator_calibration() {
        let estimator = DistanceEstimator::new();
        
        // Calibrate at 2m with -65 dBm
        estimator.set_calibration("test-device", CalibrationData {
            rssi_1m: -65.0 + (2.0 * 10.0 * 2.0_f64).log10() * 10.0, // Adjusted for 2m
            path_loss_exponent: 2.0,
            samples: 10,
        }).await;
        
        // Distance estimation should use calibrated values
        let distance = estimator.estimate_distance("test-device", -65).await;
        assert!(distance.is_finite());
    }

    #[tokio::test]
    async fn test_distance_estimator_filter_reset() {
        let estimator = DistanceEstimator::new();
        
        // Generate some estimates
        estimator.estimate_distance("device-1", -60).await;
        estimator.estimate_distance("device-1", -65).await;
        
        // Reset filter
        estimator.reset_filter("device-1").await;
        
        // Should work after reset
        let distance = estimator.estimate_distance("device-1", -60).await;
        assert!(distance.is_finite());
    }

    #[tokio::test]
    async fn test_proximity_status() {
        let estimator = Arc::new(DistanceEstimator::new());
        let detector = ProximityDetector::new(estimator);
        
        // Simulate device at close range (very strong signal)
        // -40 dBm should give distance < 0.1m
        let (_, status) = detector.update_distance("device-close", -40, 2.0, 5.0).await;
        assert_eq!(status, ProximityStatus::InRange);
        
        // Simulate device at medium range
        // -75 dBm should give distance around 5-6m (NearRange: >2m and <=5m)
        let (_, status) = detector.update_distance("device-medium", -75, 2.0, 5.0).await;
        // Note: Due to Kalman filter initialization, first reading equals the measurement
        // So distance will be calculated from -75 dBm
        // At -75 dBm: ratio = (-59 - (-75)) / 20 = 0.8, distance = 10^0.8 ≈ 6.3m
        // This should be OutOfRange (>5m)
        assert_eq!(status, ProximityStatus::OutOfRange);
        
        // Simulate device far away
        // -85 dBm should give distance > 10m
        let (_, status) = detector.update_distance("device-far", -85, 2.0, 5.0).await;
        assert_eq!(status, ProximityStatus::OutOfRange);
    }
}
