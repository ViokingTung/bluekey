import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface SignalWaveformProps {
  rssi: number;
  history?: number[];
  width?: number;
  height?: number;
  animated?: boolean;
  showValue?: boolean;
  color?: "accent" | "success" | "warning" | "danger";
  className?: string;
}

export function SignalWaveform({
  rssi,
  history = [],
  height = 60,
  animated = true,
  showValue = true,
  color = "accent",
  className,
}: SignalWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState(0);

  // Animation loop for scrolling waveform
  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      setOffset((o) => (o + 1) % 4);
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [animated]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, h);

    // Get color value
    const colorValue = {
      accent: "var(--color-accent)",
      success: "var(--color-success)",
      warning: "var(--color-warning)",
      danger: "var(--color-danger)",
    }[color];

    // Draw grid
    ctx.strokeStyle = "var(--color-border)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw waveform
    if (history.length > 1) {
      const min = -100;
      const max = -30;
      const range = max - min;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, `${colorValue}40`);
      gradient.addColorStop(1, `${colorValue}00`);

      // Draw filled area
      ctx.beginPath();
      ctx.moveTo(0, h);

      history.forEach((value, i) => {
        const x = (i / (history.length - 1)) * width;
        const normalizedValue = (value - min) / range;
        const y = h - normalizedValue * h;
        ctx.lineTo(x, y);
      });

      ctx.lineTo(width, h);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      history.forEach((value, i) => {
        const x = (i / (history.length - 1)) * width;
        const normalizedValue = (value - min) / range;
        const y = h - normalizedValue * h;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.strokeStyle = colorValue;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Draw current point
      const lastValue = history[history.length - 1];
      const lastX = width;
      const lastY = h - ((lastValue - min) / range) * h;

      ctx.beginPath();
      ctx.arc(lastX - 2, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = colorValue;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(lastX - 2, lastY, 8, 0, Math.PI * 2);
      ctx.fillStyle = `${colorValue}30`;
      ctx.fill();
    }
  }, [history, height, color, offset]);

  // Get current status color
  const getStatusColor = (): "success" | "warning" | "danger" => {
    if (rssi >= -50) return "success";
    if (rssi >= -70) return "warning";
    return "danger";
  };

  const displayColor: "accent" | "success" | "warning" | "danger" = color === "accent" ? getStatusColor() : color;

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={300}
        height={height}
        className="w-full"
        style={{ height }}
      />

      {/* Current value overlay */}
      {showValue && (
        <div className="absolute top-1 right-2 flex items-center gap-1">
          <span
            className={cn(
              "font-mono text-xs font-bold",
              displayColor === "success" && "text-success",
              displayColor === "warning" && "text-warning",
              displayColor === "danger" && "text-danger"
            )}
          >
            {rssi}dBm
          </span>
        </div>
      )}
    </div>
  );
}

// Oscilloscope-style waveform display
export interface OscilloscopeProps {
  signal: number[];
  sampleRate?: number;
  trigger?: number;
  height?: number;
  className?: string;
}

export function Oscilloscope({
  signal,
  sampleRate = 1,
  trigger = -60,
  height = 80,
  className,
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;

    // Clear with dark background
    ctx.fillStyle = "var(--color-surface)";
    ctx.fillRect(0, 0, width, h);

    // Draw grid
    ctx.strokeStyle = "var(--color-border)";
    ctx.lineWidth = 0.5;

    // Vertical grid (time)
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal grid (amplitude)
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Trigger line
    const triggerY = h - ((trigger + 100) / 70) * h;
    ctx.strokeStyle = "var(--color-warning)";
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(0, triggerY);
    ctx.lineTo(width, triggerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw signal
    if (signal.length > 0) {
      const min = -100;
      const max = -30;

      ctx.beginPath();
      ctx.strokeStyle = "var(--color-success)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "var(--color-success)";
      ctx.shadowBlur = 4;

      signal.forEach((value, i) => {
        const x = (i / signal.length) * width;
        const normalizedValue = (value - min) / (max - min);
        const y = h - normalizedValue * h;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw labels
    ctx.fillStyle = "var(--color-text-muted)";
    ctx.font = "10px monospace";
    ctx.fillText(`${sampleRate}Hz`, 4, 12);
    ctx.fillText("0dBm", 4, h - 4);
    ctx.fillText("-100dBm", width - 40, h - 4);
  }, [signal, sampleRate, trigger, height]);

  return (
    <div className={cn("relative rounded-lg overflow-hidden border border-border-soft", className)}>
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className="w-full"
        style={{ height }}
      />

      {/* Trigger indicator */}
      <div className="absolute top-1 right-2 flex items-center gap-1 text-[10px]">
        <span className="text-text-muted">TRIG:</span>
        <span className="text-warning font-mono">{trigger}dBm</span>
      </div>
    </div>
  );
}
