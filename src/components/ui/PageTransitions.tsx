import { ReactNode, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

// Page transition wrapper
export interface PageTransitionProps {
  children: ReactNode;
  transitionKey: string;
  effect?: "fade" | "slide" | "scale" | "fade-slide";
  duration?: number;
  className?: string;
}

export function PageTransition({
  children,
  transitionKey,
  effect = "fade-slide",
  duration = 300,
  className,
}: PageTransitionProps) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const [prevKey, setPrevKey] = useState(transitionKey);

  useEffect(() => {
    if (transitionKey !== prevKey) {
      setTransitioning(true);

      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitioning(false);
        setPrevKey(transitionKey);
      }, duration / 2);

      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [children, transitionKey, prevKey, duration]);

  const effectClasses = {
    fade: {
      enter: "opacity-0",
      active: "opacity-100",
      exit: "opacity-0",
    },
    slide: {
      enter: "translate-x-full opacity-0",
      active: "translate-x-0 opacity-100",
      exit: "-translate-x-full opacity-0",
    },
    scale: {
      enter: "scale-95 opacity-0",
      active: "scale-100 opacity-100",
      exit: "scale-95 opacity-0",
    },
    "fade-slide": {
      enter: "translate-y-4 opacity-0",
      active: "translate-y-0 opacity-100",
      exit: "-translate-y-4 opacity-0",
    },
  };

  const currentEffect = effectClasses[effect];

  return (
    <div
      className={cn(
        "transition-all",
        transitioning ? currentEffect.exit : currentEffect.active,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {displayChildren}
    </div>
  );
}

// Modal transition wrapper
export interface ModalTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  effect?: "fade" | "scale" | "slide-up";
  duration?: number;
  className?: string;
  onExited?: () => void;
}

export function ModalTransition({
  children,
  isOpen,
  effect = "scale",
  duration = 300,
  className,
  onExited,
}: ModalTransitionProps) {
  const [visible, setVisible] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timeout = setTimeout(() => {
        setRender(false);
        onExited?.();
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, duration, onExited]);

  const effectClasses = {
    fade: {
      enter: "opacity-0",
      active: "opacity-100",
      exit: "opacity-0",
    },
    scale: {
      enter: "opacity-0 scale-95",
      active: "opacity-100 scale-100",
      exit: "opacity-0 scale-95",
    },
    "slide-up": {
      enter: "opacity-0 translate-y-8",
      active: "opacity-100 translate-y-0",
      exit: "opacity-0 translate-y-8",
    },
  };

  const currentEffect = effectClasses[effect];

  if (!render) return null;

  return (
    <div
      className={cn(
        "transition-all",
        visible ? currentEffect.active : currentEffect.enter,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Animated presence for list items
export interface AnimatedItemProps {
  children: ReactNode;
  id: string;
  effect?: "fade" | "slide" | "scale";
  duration?: number;
  className?: string;
}

export function AnimatedItem({
  children,
  id,
  effect = "slide",
  duration = 200,
  className,
}: AnimatedItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timeout);
  }, [id]);

  const effectClasses = {
    fade: {
      enter: "opacity-0",
      active: "opacity-100",
    },
    slide: {
      enter: "opacity-0 translate-x-4",
      active: "opacity-100 translate-x-0",
    },
    scale: {
      enter: "opacity-0 scale-95",
      active: "opacity-100 scale-100",
    },
  };

  const currentEffect = effectClasses[effect];

  return (
    <div
      key={id}
      className={cn(
        "transition-all",
        visible ? currentEffect.active : currentEffect.enter,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// List with staggered animations
export interface AnimatedListProps {
  children: ReactNode[];
  staggerDelay?: number;
  effect?: "fade" | "slide" | "scale";
  className?: string;
}

export function AnimatedList({
  children,
  staggerDelay = 50,
  effect = "slide",
  className,
}: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedItem
          key={index}
          id={`item-${index}`}
          effect={effect}
          duration={200 + index * staggerDelay}
        >
          {child}
        </AnimatedItem>
      ))}
    </div>
  );
}

// Crossfade between two elements
export interface CrossfadeProps {
  current: ReactNode;
  currentKey: string;
  duration?: number;
  className?: string;
}

export function Crossfade({
  current,
  currentKey,
  duration = 300,
  className,
}: CrossfadeProps) {
  const [display, setDisplay] = useState<{ key: string; node: ReactNode }>({
    key: currentKey,
    node: current,
  });
  const [prev, setPrev] = useState<{ key: string; node: ReactNode } | null>(null);

  useEffect(() => {
    if (currentKey !== display.key) {
      setPrev(display);
      setDisplay({ key: currentKey, node: current });
    }
  }, [current, currentKey, display]);

  useEffect(() => {
    if (prev) {
      const timeout = setTimeout(() => setPrev(null), duration);
      return () => clearTimeout(timeout);
    }
  }, [prev, duration]);

  return (
    <div className={cn("relative", className)}>
      {prev && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{ opacity: 0, transitionDuration: `${duration}ms` }}
        >
          {prev.node}
        </div>
      )}
      <div
        className="transition-opacity"
        style={{ opacity: 1, transitionDuration: `${duration}ms` }}
      >
        {display.node}
      </div>
    </div>
  );
}

// Slide panel animation
export interface SlidePanelProps {
  children: ReactNode;
  isOpen: boolean;
  direction?: "left" | "right" | "top" | "bottom";
  size?: string;
  duration?: number;
  className?: string;
  onClose?: () => void;
}

export function SlidePanel({
  children,
  isOpen,
  direction = "right",
  size = "300px",
  duration = 300,
  className,
  onClose,
}: SlidePanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const directionStyles = {
    left: {
      panel: "left-0 top-0 bottom-0 h-full",
      transform: visible ? "translate-x-0" : "-translate-x-full",
    },
    right: {
      panel: "right-0 top-0 bottom-0 h-full",
      transform: visible ? "translate-x-0" : "translate-x-full",
    },
    top: {
      panel: "top-0 left-0 right-0 w-full",
      transform: visible ? "translate-y-0" : "-translate-y-full",
    },
    bottom: {
      panel: "bottom-0 left-0 right-0 w-full",
      transform: visible ? "translate-y-0" : "translate-y-full",
    },
  };

  const current = directionStyles[direction];

  if (!isOpen && !visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/50 backdrop-blur-sm z-40 transition-opacity",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{ transitionDuration: `${duration}ms` }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 bg-surface border-border-soft shadow-xl transition-transform",
          direction === "left" || direction === "right" ? "border-l" : "border-t",
          current.panel,
          className
        )}
        style={{
          width: direction === "left" || direction === "right" ? size : undefined,
          height: direction === "top" || direction === "bottom" ? size : undefined,
          transform: current.transform,
          transitionDuration: `${duration}ms`,
        }}
      >
        {children}
      </div>
    </>
  );
}
