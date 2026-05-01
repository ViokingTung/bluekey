import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, Info, X as CloseIcon } from "lucide-react";
import { cn } from "../../lib/utils";

// Toast notification
export interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  visible: boolean;
  onClose: () => void;
  className?: string;
}

export function Toast({
  message,
  type,
  duration = 3000,
  visible,
  onClose,
  className,
}: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const icons = {
    success: Check,
    error: X,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "bg-success/10 border-success/30 text-success",
    error: "bg-danger/10 border-danger/30 text-danger",
    warning: "bg-warning/10 border-warning/30 text-warning",
    info: "bg-accent/10 border-accent/30 text-accent",
  };

  const Icon = icons[type];

  if (!visible && !show) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300",
        colors[type],
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setShow(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
      >
        <CloseIcon className="w-3 h-3" />
      </button>
    </div>
  );
}

// Toast container for multiple toasts
export interface ToastContainerProps {
  children: React.ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

export function ToastContainer({
  children,
  position = "bottom-right",
  className,
}: ToastContainerProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2",
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}

// Success checkmark animation
export interface SuccessCheckProps {
  visible: boolean;
  size?: number;
  className?: string;
}

export function SuccessCheck({ visible, size = 48, className }: SuccessCheckProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Circle */}
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full"
        >
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="2"
            className="animate-draw-circle"
          />
        </svg>

        {/* Checkmark */}
        <svg
          viewBox="0 0 48 48"
          className="absolute inset-0 w-full h-full"
        >
          <path
            d="M14 24 L20 30 L34 16"
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-check"
          />
        </svg>
      </div>
    </div>
  );
}

// Error shake animation
export interface ErrorFeedbackProps {
  visible: boolean;
  message?: string;
  onComplete?: () => void;
  className?: string;
}

export function ErrorFeedback({
  visible,
  message,
  onComplete,
  className,
}: ErrorFeedbackProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 text-danger animate-shake",
        className
      )}
    >
      <X className="w-5 h-5" />
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
}

// Loading spinner
export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function Spinner({ size = "md", color = "var(--color-accent)", className }: SpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("animate-spin", sizes[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--color-border)"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Loading dots
export interface LoadingDotsProps {
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingDots({ color = "var(--color-accent)", size = "md", className }: LoadingDotsProps) {
  const sizes = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("rounded-full animate-bounce", sizes[size])}
          style={{
            backgroundColor: color,
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Progress bar with animation
export interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  animated?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  color = "var(--color-accent)",
  height = 4,
  animated = true,
  showLabel = false,
  className,
}: ProgressBarProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Background */}
      <div
        className="w-full bg-surface-hover rounded-full overflow-hidden"
        style={{ height }}
      >
        {/* Progress */}
        <div
          className={cn(
            "h-full rounded-full transition-all",
            animated && "transition-progress"
          )}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: color,
            transitionDuration: animated ? "500ms" : "0ms",
          }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-text-muted">
          <span>0%</span>
          <span>{Math.round(progress)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}

// Confetti celebration effect
export interface ConfettiProps {
  visible: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function Confetti({ visible, duration = 2000, onComplete }: ConfettiProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onComplete]);

  if (!show) return null;

  const colors = ["var(--color-success)", "var(--color-accent)", "var(--color-warning)"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            width: "8px",
            height: "8px",
            backgroundColor: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
            animationDelay: `${Math.random() * 500}ms`,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Haptic-like feedback indicator
export interface HapticFeedbackProps {
  trigger: boolean;
  type?: "light" | "medium" | "heavy";
  className?: string;
}

export function HapticFeedback({
  trigger,
  type = "medium",
  className,
}: HapticFeedbackProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 100);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const intensities = {
    light: "scale-[0.98]",
    medium: "scale-[0.96]",
    heavy: "scale-[0.94]",
  };

  return (
    <div
      className={cn(
        "transition-transform duration-100",
        active && intensities[type],
        className
      )}
    />
  );
}
