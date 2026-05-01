import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

// Swipe detector hook
export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe(handlers: SwipeHandlers) {
  const ref = useRef<HTMLElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const threshold = handlers.threshold ?? 50;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX.current;
      const diffY = endY - startY.current;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        }
      } else {
        if (Math.abs(diffY) > threshold) {
          if (diffY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handlers, threshold]);

  return ref;
}

// Swipeable card component
export interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    setOffset(Math.max(-100, Math.min(100, diff)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offset > 80 && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -80 && onSwipeLeft) {
      onSwipeLeft();
    }
    setOffset(0);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left action background */}
      {rightAction && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 flex items-center justify-end px-4 bg-success/20 transition-opacity",
            offset > 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(0, offset) }}
        >
          {rightAction}
        </div>
      )}

      {/* Right action background */}
      {leftAction && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center justify-start px-4 bg-danger/20 transition-opacity",
            offset < 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(0, -offset) }}
        >
          {leftAction}
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: `translateX(${offset}px)`,
          transitionDuration: isDragging ? "0ms" : "200ms",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Long press detector
export interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  delay?: number;
  className?: string;
}

export function LongPress({
  children,
  onLongPress,
  delay = 500,
  className,
}: LongPressProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const startPress = () => {
    setIsPressed(true);
    timer.current = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, delay);
  };

  const endPress = () => {
    setIsPressed(false);
    if (timer.current) {
      clearTimeout(timer.current);
    }
  };

  return (
    <div
      className={cn(
        "select-none",
        isPressed && "scale-95",
        "transition-transform",
        className
      )}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
    >
      {children}
    </div>
  );
}

// Pull to refresh
export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  pullDistance?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  pullDistance = 80,
  className,
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [offset, setOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.currentTarget.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setOffset(Math.min(pullDistance * 1.5, diff));
    }
  };

  const handleTouchEnd = async () => {
    setPulling(false);
    if (offset >= pullDistance && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setOffset(0);
  };

  return (
    <div
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-all",
          refreshing && "animate-spin"
        )}
        style={{
          top: -60 + offset,
          height: 60,
          opacity: Math.min(1, offset / pullDistance),
        }}
      >
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transitionDuration: pulling ? "0ms" : "200ms",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Drag and drop list
export interface DraggableItem {
  id: string;
  content: React.ReactNode;
}

export interface DragDropListProps {
  items: DraggableItem[];
  onReorder: (items: DraggableItem[]) => void;
  className?: string;
}

export function DragDropList({
  items,
  onReorder,
  className,
}: DragDropListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;

    const currentIndex = items.findIndex((item) => item.id === draggingId);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    const newItems = [...items];
    const [removed] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    onReorder(newItems);
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDrop={() => handleDrop(item.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "p-3 rounded-lg bg-surface/30 border border-border-soft cursor-grab transition-all",
            draggingId === item.id && "opacity-50 scale-95",
            dragOverId === item.id && "border-accent border-2"
          )}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}

// Pinch to zoom
export interface PinchZoomProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export function PinchZoom({
  children,
  minScale = 0.5,
  maxScale = 3,
  className,
}: PinchZoomProps) {
  const [scale, setScale] = useState(1);
  const startDistance = useRef(0);
  const startScale = useRef(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      startDistance.current = Math.sqrt(dx * dx + dy * dy);
      startScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const newScale = (distance / startDistance.current) * startScale.current;
      setScale(Math.max(minScale, Math.min(maxScale, newScale)));
    }
  };

  return (
    <div
      className={cn("overflow-hidden touch-none", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div
        className="origin-center transition-transform"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

// Hover scale effect
export interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.02, className }: HoverScaleProps) {
  return (
    <div
      className={cn(
        "transition-transform duration-200 cursor-pointer",
        "hover:scale-[var(--hover-scale)]",
        className
      )}
      style={{ "--hover-scale": scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Touch ripple effect
export interface TouchRippleProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function TouchRipple({
  children,
  color = "rgba(255, 255, 255, 0.3)",
  className,
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouch}
      onMouseDown={handleTouch}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}
