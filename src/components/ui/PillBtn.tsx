import { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface PillBtnProps {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PillBtn({ children, primary, onClick, disabled, className }: PillBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
        "hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        primary && "bg-accent text-white shadow-[0_2px_8px_var(--accent-40)] hover:shadow-[0_4px_12px_var(--accent-40)]",
        !primary && "bg-surface-hover text-text border border-border hover:bg-surface-active",
        className
      )}
    >
      {children}
    </button>
  );
}
