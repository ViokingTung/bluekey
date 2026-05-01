import { cn } from "../../lib/utils";

// Base skeleton element
export interface SkeletonProps {
  className?: string;
  animate?: boolean;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  animate = true,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={cn(
        "bg-surface-hover",
        animate && "animate-skeleton-pulse",
        variantClasses[variant],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Device card skeleton
export interface DeviceCardSkeletonProps {
  className?: string;
}

export function DeviceCardSkeleton({ className }: DeviceCardSkeletonProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border border-border-soft bg-surface/30 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={10} />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>

      {/* Signal bars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={4} height={12 + i * 4} />
        ))}
      </div>

      {/* Distance */}
      <Skeleton width="100%" height={8} />
    </div>
  );
}

// Device list skeleton
export interface DeviceListSkeletonProps {
  count?: number;
  className?: string;
}

export function DeviceListSkeleton({ count = 3, className }: DeviceListSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <DeviceCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Monitor status skeleton
export interface MonitorSkeletonProps {
  className?: string;
}

export function MonitorSkeleton({ className }: MonitorSkeletonProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border border-border-soft bg-surface/30 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton width={120} height={14} />
      </div>

      {/* Description */}
      <Skeleton width="100%" height={10} />
      <Skeleton width="80%" height={10} />

      {/* Buttons */}
      <div className="flex gap-3">
        <Skeleton width={100} height={32} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
}

// Settings panel skeleton
export interface SettingsSkeletonProps {
  className?: string;
}

export function SettingsSkeleton({ className }: SettingsSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Section 1 */}
      <div className="space-y-3">
        <Skeleton width={100} height={12} />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface/30">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton width={100} height={12} />
              </div>
              <Skeleton variant="circular" width={20} height={20} />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 */}
      <div className="space-y-3">
        <Skeleton width={80} height={12} />
        <div className="p-4 rounded-lg bg-surface/30 space-y-3">
          <Skeleton width="100%" height={10} />
          <Skeleton width="100%" height={32} />
        </div>
      </div>
    </div>
  );
}

// Activity log skeleton
export interface ActivityLogSkeletonProps {
  count?: number;
  className?: string;
}

export function ActivityLogSkeleton({ count = 5, className }: ActivityLogSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg bg-surface/30"
        >
          <Skeleton variant="circular" width={24} height={24} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={12} />
            <Skeleton width="30%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full page loading skeleton
export interface PageSkeletonProps {
  type?: "devices" | "settings" | "activity";
  className?: string;
}

export function PageSkeleton({ type = "devices", className }: PageSkeletonProps) {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width={100} height={14} />
        <div className="flex-1" />
        <Skeleton width={80} height={28} />
      </div>

      {type === "devices" && (
        <>
          <MonitorSkeleton />
          <DeviceListSkeleton count={3} />
        </>
      )}

      {type === "settings" && <SettingsSkeleton />}

      {type === "activity" && <ActivityLogSkeleton />}
    </div>
  );
}

// Shimmer effect skeleton (more sophisticated loading)
export interface ShimmerSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function ShimmerSkeleton({ className, width, height }: ShimmerSkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface-hover",
        className
      )}
      style={{ width, height }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// Content loader with fade transition
export interface ContentLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
  className?: string;
}

export function ContentLoader({
  loading,
  children,
  skeleton,
  className,
}: ContentLoaderProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>

      {loading && (
        <div className="absolute inset-0 transition-opacity duration-300 opacity-100">
          {skeleton}
        </div>
      )}
    </div>
  );
}
