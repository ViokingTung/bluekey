import { useEffect, useState } from "react";
import { Lock, Unlock, Check, X } from "lucide-react";
import { cn } from "../lib/utils";

export type LockAction = "lock" | "unlock" | "none";

export interface LockAnimationProps {
  action: LockAction;
  deviceName?: string;
  onComplete?: () => void;
}

export function LockAnimation({ action, deviceName, onComplete }: LockAnimationProps) {
  const [phase, setPhase] = useState<"animating" | "success" | "hidden">("hidden");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (action === "none") {
      setPhase("hidden");
      setProgress(0);
      return;
    }

    // Start animation
    setPhase("animating");
    setProgress(0);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return p + 5;
      });
    }, 50);

    // Complete after animation
    const completeTimer = setTimeout(() => {
      setPhase("success");
      // Auto hide after success
      setTimeout(() => {
        setPhase("hidden");
        onComplete?.();
      }, 1500);
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [action, onComplete]);

  if (phase === "hidden" || action === "none") {
    return null;
  }

  const isUnlock = action === "unlock";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        {/* Icon Container */}
        <div
          className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center",
            "transition-all duration-500",
            phase === "animating" && (isUnlock ? "bg-accent/20" : "bg-danger/20"),
            phase === "success" && (isUnlock ? "bg-success/20" : "bg-danger/20")
          )}
        >
          {/* Progress Ring */}
          {phase === "animating" && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="3"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke={isUnlock ? "var(--color-accent)" : "var(--color-danger)"}
                strokeWidth="3"
                strokeDasharray={`${progress * 2.76} 276`}
                className="transition-all duration-100"
              />
            </svg>
          )}

          {/* Icon */}
          <div
            className={cn(
              "transition-all duration-300",
              phase === "animating" && "animate-pulse",
              phase === "success" && "scale-110"
            )}
          >
            {phase === "animating" && (
              isUnlock ? (
                <Unlock className={cn("w-10 h-10 text-accent")} />
              ) : (
                <Lock className={cn("w-10 h-10 text-danger")} />
              )
            )}
            {phase === "success" && (
              isUnlock ? (
                <Unlock className="w-10 h-10 text-success" />
              ) : (
                <Check className="w-10 h-10 text-danger" />
              )
            )}
          </div>

          {/* Glow effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-full opacity-50",
              phase === "animating" && (isUnlock ? "animate-glow-accent" : "animate-glow-danger"),
              phase === "success" && (isUnlock ? "shadow-[0_0_40px_var(--color-success)]" : "shadow-[0_0_40px_var(--color-danger)]")
            )}
          />
        </div>

        {/* Text */}
        <div className="mt-6 text-center">
          <h3 className="font-display text-lg font-semibold">
            {phase === "animating" && (isUnlock ? "正在解锁..." : "正在锁定...")}
            {phase === "success" && (isUnlock ? "已解锁" : "已锁定")}
          </h3>
          {deviceName && (
            <p className="text-sm text-text-muted mt-1">
              {deviceName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast notification for lock/unlock events
export interface LockToastProps {
  action: "lock" | "unlock";
  deviceName?: string;
  visible: boolean;
  onDismiss: () => void;
}

export function LockToast({ action, deviceName, visible, onDismiss }: LockToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  const isUnlock = action === "unlock";

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg",
          "glass border",
          isUnlock ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isUnlock ? "bg-success/20" : "bg-danger/20"
          )}
        >
          {isUnlock ? (
            <Unlock className="w-4 h-4 text-success" />
          ) : (
            <Lock className="w-4 h-4 text-danger" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            {isUnlock ? "已自动解锁" : "已自动锁定"}
          </p>
          {deviceName && (
            <p className="text-xs text-text-muted">{deviceName}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-hover"
        >
          <X className="w-3 h-3 text-text-muted" />
        </button>
      </div>
    </div>
  );
}
