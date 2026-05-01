import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

// Ripple effect for buttons
export interface RippleProps {
  children: React.ReactNode;
  className?: string;
  color?: "light" | "dark";
}

export function Ripple({ children, className, color = "light" }: RippleProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={cn(
            "absolute rounded-full animate-ripple pointer-events-none",
            color === "light" ? "bg-white/30" : "bg-black/20"
          )}
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
          }}
        />
      ))}
    </div>
  );
}

// Animated toggle switch
export interface AnimatedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function AnimatedToggle({
  checked,
  onChange,
  size = "md",
  disabled = false,
  className,
}: AnimatedToggleProps) {
  const sizes = {
    sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: "translate-x-4" },
    md: { track: "w-10 h-5", thumb: "w-4 h-4", translate: "translate-x-5" },
    lg: { track: "w-12 h-6", thumb: "w-5 h-5", translate: "translate-x-6" },
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-accent/50",
        sizes[size].track,
        checked
          ? "bg-accent shadow-[0_0_12px_var(--color-accent)]"
          : "bg-surface-hover",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-white shadow-md transition-all duration-300",
          sizes[size].thumb,
          checked ? sizes[size].translate : "translate-x-0.5"
        )}
      />
    </button>
  );
}

// Pulse animation wrapper
export interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  color?: string;
  className?: string;
}

export function Pulse({ children, active = true, color = "var(--color-accent)", className }: PulseProps) {
  if (!active) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div
        className="absolute inset-0 rounded-[inherit] animate-ping opacity-20"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// Bounce animation on state change
export interface BounceProps {
  children: React.ReactNode;
  trigger: unknown;
  className?: string;
}

export function Bounce({ children, trigger, className }: BounceProps) {
  const [bounce, setBounce] = useState(false);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (prevTrigger.current !== trigger) {
      prevTrigger.current = trigger;
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div
      className={cn(
        "transition-transform",
        bounce && "animate-bounce-once",
        className
      )}
    >
      {children}
    </div>
  );
}

// Scale on hover
export interface ScaleOnHoverProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export function ScaleOnHover({
  children,
  scale = 1.05,
  duration = 200,
  className,
}: ScaleOnHoverProps) {
  return (
    <div
      className={cn("transition-transform hover:scale-[var(--scale)]", className)}
      style={
        {
          "--scale": scale,
          transitionDuration: `${duration}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

// Glow effect on hover
export interface GlowOnHoverProps {
  children: React.ReactNode;
  color?: string;
  intensity?: "sm" | "md" | "lg";
  className?: string;
}

export function GlowOnHover({
  children,
  color = "var(--color-accent)",
  intensity = "md",
  className,
}: GlowOnHoverProps) {
  const intensities = {
    sm: "hover:shadow-[0_0_10px_var(--glow-color)]",
    md: "hover:shadow-[0_0_20px_var(--glow-color)]",
    lg: "hover:shadow-[0_0_30px_var(--glow-color)]",
  };

  return (
    <div
      className={cn(
        "transition-shadow duration-300",
        intensities[intensity],
        className
      )}
      style={
        {
          "--glow-color": color,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

// Shake animation for errors
export interface ShakeProps {
  children: React.ReactNode;
  shake: boolean;
  onComplete?: () => void;
  className?: string;
}

export function Shake({ children, shake, onComplete, className }: ShakeProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (shake) {
      setIsShaking(true);
      const timer = setTimeout(() => {
        setIsShaking(false);
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shake, onComplete]);

  return (
    <div
      className={cn(
        "transition-transform",
        isShaking && "animate-shake",
        className
      )}
    >
      {children}
    </div>
  );
}

// Fade in on mount
export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  direction = "up",
  className,
}: FadeInProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directions = {
    up: "translate-y-4",
    down: "-translate-y-4",
    left: "translate-x-4",
    right: "-translate-x-4",
    none: "",
  };

  return (
    <div
      className={cn(
        "transition-all",
        duration && `duration-${duration}`,
        visible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${directions[direction]}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// Stagger children animation
export interface StaggerProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export function Stagger({
  children,
  delay = 0,
  staggerDelay = 100,
  className,
}: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={delay + index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Progress ring animation
export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  color = "var(--color-accent)",
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className={cn("-rotate-90", className)}>
      {/* Background */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}
