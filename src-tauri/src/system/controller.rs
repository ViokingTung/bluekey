//! System controller implementation

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{debug, error, info};

/// System lock state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum LockState {
    /// System is unlocked
    Unlocked,
    /// System is locked
    Locked,
    /// State unknown
    Unknown,
}

impl Default for LockState {
    fn default() -> Self {
        LockState::Unknown
    }
}

/// System controller for lock/unlock operations
pub struct SystemController {
    /// Current lock state
    state: Arc<Mutex<LockState>>,
}

impl SystemController {
    /// Create a new system controller
    pub fn new() -> Self {
        SystemController {
            state: Arc::new(Mutex::new(LockState::Unknown)),
        }
    }
    
    /// Lock the system screen
    pub async fn lock_screen(&self) -> Result<(), SystemError> {
        info!("Locking screen...");
        
        #[cfg(target_os = "macos")]
        {
            self.lock_macos().await?;
        }
        
        #[cfg(target_os = "windows")]
        {
            self.lock_windows().await?;
        }
        
        #[cfg(target_os = "linux")]
        {
            self.lock_linux().await?;
        }
        
        // Update state
        let mut state = self.state.lock().await;
        *state = LockState::Locked;
        
        info!("Screen locked successfully");
        Ok(())
    }
    
    /// Get current lock state
    pub async fn get_state(&self) -> LockState {
        *self.state.lock().await
    }
    
    /// Update lock state (called when system unlock is detected)
    #[allow(dead_code)]
    pub async fn set_state(&self, state: LockState) {
        let mut current = self.state.lock().await;
        *current = state;
    }
    
    /// Check if system is locked
    pub async fn is_locked(&self) -> bool {
        *self.state.lock().await == LockState::Locked
    }
    
    // ==================== Platform-specific implementations ====================
    
    #[cfg(target_os = "macos")]
    async fn lock_macos(&self) -> Result<(), SystemError> {
        use std::process::Command;
        
        // Method 1: Use pmset to sleep display
        let output = Command::new("pmset")
            .arg("displaysleepnow")
            .output();
        
        match output {
            Ok(_) => {
                debug!("macOS: Triggered display sleep");
                return Ok(());
            }
            Err(e) => {
                debug!("pmset failed: {}, trying alternative method", e);
            }
        }
        
        // Method 2: Use screensaver engine
        let output = Command::new("/System/Library/CoreServices/ScreenSaver.engine")
            .arg("Contents/MacOS/ScreenSaverEngine")
            .output();
        
        match output {
            Ok(_) => {
                debug!("macOS: Started screensaver");
                Ok(())
            }
            Err(e) => {
                error!("macOS lock failed: {}", e);
                Err(SystemError::LockFailed(format!("macOS lock failed: {}", e)))
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    async fn lock_windows(&self) -> Result<(), SystemError> {
        use std::process::Command;
        
        // Use rundll32 to lock workstation
        let output = Command::new("rundll32.exe")
            .args(["user32.dll,LockWorkStation"])
            .output();
        
        match output {
            Ok(_) => {
                debug!("Windows: Locked workstation");
                Ok(())
            }
            Err(e) => {
                error!("Windows lock failed: {}", e);
                Err(SystemError::LockFailed(format!("Windows lock failed: {}", e)))
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    async fn lock_linux(&self) -> Result<(), SystemError> {
        use std::process::Command;
        
        // Try multiple methods for Linux
        
        // Method 1: loginctl (systemd)
        let output = Command::new("loginctl")
            .args(["lock-session"])
            .output();
        
        if let Ok(output) = output {
            if output.status.success() {
                debug!("Linux: Locked via loginctl");
                return Ok(());
            }
        }
        
        // Method 2: gnome screensaver
        let output = Command::new("gnome-screensaver-command")
            .args(["-l"])
            .output();
        
        if let Ok(output) = output {
            if output.status.success() {
                debug!("Linux: Locked via gnome-screensaver");
                return Ok(());
            }
        }
        
        // Method 3: xfce screensaver
        let output = Command::new("xflock4")
            .output();
        
        if let Ok(output) = output {
            if output.status.success() {
                debug!("Linux: Locked via xflock4");
                return Ok(());
            }
        }
        
        // Method 4: Cinnamon screensaver
        let output = Command::new("cinnamon-screensaver")
            .args(["lock"])
            .output();
        
        if let Ok(output) = output {
            if output.status.success() {
                debug!("Linux: Locked via cinnamon-screensaver");
                return Ok(());
            }
        }
        
        error!("Linux lock failed: no supported screensaver found");
        Err(SystemError::LockFailed(
            "Linux lock failed: no supported screensaver found. \
             Please ensure gnome-screensaver, xfce4-screensaver, or cinnamon-screensaver is installed."
                .to_string(),
        ))
    }
}

impl Default for SystemController {
    fn default() -> Self {
        Self::new()
    }
}

/// System error types
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum SystemError {
    #[error("Lock failed: {0}")]
    LockFailed(String),
    #[error("Unlock failed: {0}")]
    UnlockFailed(String),
    #[error("Platform not supported: {0}")]
    PlatformNotSupported(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lock_state_equality() {
        assert_eq!(LockState::Unlocked, LockState::Unlocked);
        assert_eq!(LockState::Locked, LockState::Locked);
        assert_ne!(LockState::Unlocked, LockState::Locked);
    }

    #[tokio::test]
    async fn test_system_controller_initialization() {
        let controller = SystemController::new();
        
        // Initial state should be Unknown
        let state = controller.get_state().await;
        assert_eq!(state, LockState::Unknown);
    }

    #[tokio::test]
    async fn test_system_controller_state_management() {
        let controller = SystemController::new();
        
        // Set state to Locked
        controller.set_state(LockState::Locked).await;
        assert_eq!(controller.get_state().await, LockState::Locked);
        
        // Set state to Unlocked
        controller.set_state(LockState::Unlocked).await;
        assert_eq!(controller.get_state().await, LockState::Unlocked);
    }

    #[tokio::test]
    async fn test_system_controller_is_locked() {
        let controller = SystemController::new();
        
        controller.set_state(LockState::Locked).await;
        assert!(controller.is_locked().await);
        
        controller.set_state(LockState::Unlocked).await;
        assert!(!controller.is_locked().await);
        
        controller.set_state(LockState::Unknown).await;
        assert!(!controller.is_locked().await);
    }

    #[test]
    fn test_system_error_display() {
        let err = SystemError::LockFailed("test error".to_string());
        assert_eq!(format!("{}", err), "Lock failed: test error");
        
        let err = SystemError::PlatformNotSupported("TestOS".to_string());
        assert_eq!(format!("{}", err), "Platform not supported: TestOS");
    }
}
