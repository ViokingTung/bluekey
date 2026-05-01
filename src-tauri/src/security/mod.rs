//! Security module for device verification and audit logging

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::info;

/// Device verification code
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationCode {
    /// The 6-digit code
    pub code: String,
    /// When it was generated
    pub generated_at: DateTime<Utc>,
    /// When it expires
    pub expires_at: DateTime<Utc>,
    /// Device ID it's associated with
    pub device_id: String,
}

impl VerificationCode {
    /// Generate a new verification code for a device
    pub fn generate(device_id: String) -> Self {
        let now = Utc::now();
        let code = format!("{:06}", rand::random::<u32>() % 1_000_000);
        
        VerificationCode {
            code,
            generated_at: now,
            expires_at: now + chrono::Duration::minutes(5),
            device_id,
        }
    }
    
    /// Check if the code is still valid
    pub fn is_valid(&self) -> bool {
        Utc::now() < self.expires_at
    }
    
    /// Verify a code
    pub fn verify(&self, code: &str) -> bool {
        self.code == code && self.is_valid()
    }
}

/// Audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogEntry {
    /// Unique ID
    pub id: String,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    /// Event type
    pub event_type: AuditEventType,
    /// Device ID (if applicable)
    pub device_id: Option<String>,
    /// Device name (if applicable)
    pub device_name: Option<String>,
    /// Additional details
    pub details: Option<String>,
    /// Success or failure
    pub success: bool,
}

/// Types of audit events
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AuditEventType {
    /// Device paired
    DevicePaired,
    /// Device unpaired
    DeviceUnpaired,
    /// Device enabled
    DeviceEnabled,
    /// Device disabled
    DeviceDisabled,
    /// Monitoring started
    MonitoringStarted,
    /// Monitoring stopped
    MonitoringStopped,
    /// Auto lock triggered
    AutoLockTriggered,
    /// Auto unlock triggered
    AutoUnlockTriggered,
    /// Manual lock
    ManualLock,
    /// Device verified
    DeviceVerified,
    /// Verification failed
    VerificationFailed,
    /// Settings changed
    SettingsChanged,
}

/// Audit log storage
pub struct AuditLog {
    /// Log entries (limited to last 1000)
    entries: Arc<Mutex<VecDeque<AuditLogEntry>>>,
    /// Maximum entries to keep
    max_entries: usize,
}

impl AuditLog {
    /// Create a new audit log
    pub fn new() -> Self {
        AuditLog {
            entries: Arc::new(Mutex::new(VecDeque::with_capacity(1000))),
            max_entries: 1000,
        }
    }
    
    /// Add an entry to the log
    pub async fn log(&self, event_type: AuditEventType, device_id: Option<String>, device_name: Option<String>, details: Option<String>, success: bool) {
        let entry = AuditLogEntry {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            event_type,
            device_id,
            device_name,
            details,
            success,
        };
        
        info!("Audit log: {:?} - success: {}", entry.event_type, entry.success);
        
        let mut entries = self.entries.lock().await;
        if entries.len() >= self.max_entries {
            entries.pop_front();
        }
        entries.push_back(entry);
    }
    
    /// Get all entries
    pub async fn get_entries(&self) -> Vec<AuditLogEntry> {
        let entries = self.entries.lock().await;
        entries.iter().cloned().collect()
    }
    
    /// Get entries for a specific device
    #[allow(dead_code)]
    pub async fn get_device_entries(&self, device_id: &str) -> Vec<AuditLogEntry> {
        let entries = self.entries.lock().await;
        entries
            .iter()
            .filter(|e| e.device_id.as_deref() == Some(device_id))
            .cloned()
            .collect()
    }
    
    /// Clear all entries
    pub async fn clear(&self) {
        let mut entries = self.entries.lock().await;
        entries.clear();
    }
}

impl Default for AuditLog {
    fn default() -> Self {
        Self::new()
    }
}

/// Security manager combining verification and audit
pub struct SecurityManager {
    /// Pending verification codes
    pending_codes: Arc<Mutex<Vec<VerificationCode>>>,
    /// Audit log
    audit_log: Arc<Mutex<AuditLog>>,
}

impl SecurityManager {
    /// Create a new security manager
    pub fn new() -> Self {
        SecurityManager {
            pending_codes: Arc::new(Mutex::new(Vec::new())),
            audit_log: Arc::new(Mutex::new(AuditLog::new())),
        }
    }
    
    /// Generate a verification code for a device
    pub async fn generate_code(&self, device_id: String) -> VerificationCode {
        let code = VerificationCode::generate(device_id.clone());
        
        let mut pending = self.pending_codes.lock().await;
        // Remove expired codes
        pending.retain(|c| c.is_valid());
        // Remove any existing code for this device
        pending.retain(|c| c.device_id != device_id);
        // Add new code
        pending.push(code.clone());
        
        code
    }
    
    /// Verify a code for a device
    pub async fn verify_code(&self, device_id: &str, code: &str) -> bool {
        let mut pending = self.pending_codes.lock().await;
        
        if let Some(pos) = pending.iter().position(|c| c.device_id == device_id && c.verify(code)) {
            pending.remove(pos);
            true
        } else {
            false
        }
    }
    
    /// Get audit log
    pub async fn get_audit_log(&self) -> Arc<Mutex<AuditLog>> {
        self.audit_log.clone()
    }
    
    /// Log an event
    pub async fn log_event(
        &self,
        event_type: AuditEventType,
        device_id: Option<String>,
        device_name: Option<String>,
        details: Option<String>,
        success: bool,
    ) {
        let audit = self.audit_log.lock().await;
        audit.log(event_type, device_id, device_name, details, success).await;
    }
}

impl Default for SecurityManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verification_code_generation() {
        let code = VerificationCode::generate("test-device".to_string());
        
        assert_eq!(code.device_id, "test-device");
        assert_eq!(code.code.len(), 6);
        assert!(code.code.chars().all(|c| c.is_numeric()));
        assert!(code.is_valid());
    }

    #[test]
    fn test_verification_code_expiry() {
        let mut code = VerificationCode::generate("test-device".to_string());
        // Manually set expired time
        code.expires_at = Utc::now() - chrono::Duration::seconds(1);
        
        assert!(!code.is_valid());
    }

    #[test]
    fn test_verification_code_verify() {
        let code = VerificationCode::generate("test-device".to_string());
        let code_str = code.code.clone();
        
        assert!(code.verify(&code_str));
        assert!(!code.verify("000000"));
    }

    #[tokio::test]
    async fn test_security_manager_generate_and_verify() {
        let manager = SecurityManager::new();
        
        let code = manager.generate_code("device-1".to_string()).await;
        let code_str = code.code.clone();
        
        // Correct code should verify
        let result = manager.verify_code("device-1", &code_str).await;
        assert!(result);
        
        // Already used code should not verify again
        let result2 = manager.verify_code("device-1", &code_str).await;
        assert!(!result2);
    }

    #[tokio::test]
    async fn test_audit_log() {
        let log = AuditLog::new();
        
        log.log(
            AuditEventType::DevicePaired,
            Some("device-1".to_string()),
            Some("Test Device".to_string()),
            None,
            true,
        ).await;
        
        let entries = log.get_entries().await;
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].event_type, AuditEventType::DevicePaired);
        assert_eq!(entries[0].device_id, Some("device-1".to_string()));
        assert!(entries[0].success);
    }

    #[tokio::test]
    async fn test_audit_log_max_entries() {
        let log = AuditLog::new();
        
        // Add more than max_entries
        for i in 0..1010 {
            log.log(
                AuditEventType::DevicePaired,
                Some(format!("device-{}", i)),
                None,
                None,
                true,
            ).await;
        }
        
        let entries = log.get_entries().await;
        assert_eq!(entries.len(), 1000);
    }

    #[tokio::test]
    async fn test_audit_log_clear() {
        let log = AuditLog::new();
        
        log.log(
            AuditEventType::DevicePaired,
            None,
            None,
            None,
            true,
        ).await;
        
        assert!(!log.get_entries().await.is_empty());
        
        log.clear().await;
        
        assert!(log.get_entries().await.is_empty());
    }
}
