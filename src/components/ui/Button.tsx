import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "hover:scale-[1.02] active:scale-[0.98]",
          {
            "bg-accent text-white shadow-[0_2px_8px_var(--accent-40)] hover:shadow-[0_4px_12px_var(--accent-40)]": variant === "default",
            "bg-danger text-white shadow-[0_2px_8px_rgba(255,69,58,0.4)] hover:shadow-[0_4px_12px_rgba(255,69,58,0.4)]": variant === "destructive",
            "border border-border bg-transparent hover:bg-surface-hover hover:border-border": variant === "outline",
            "bg-surface/50 text-text hover:bg-surface-hover": variant === "secondary",
            "hover:bg-surface-hover": variant === "ghost",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-lg px-3 text-xs": size === "sm",
            "h-10 rounded-lg px-6": size === "lg",
            "h-9 w-9 rounded-lg": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
