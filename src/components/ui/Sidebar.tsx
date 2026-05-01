import { ReactNode } from "react";
import { cn } from "../../lib/utils";

async function winClose() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().close();
}
async function winMinimize() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().minimize();
}


// Icons mapping for sidebar items
const iconMap: Record<string, ReactNode> = {
  list: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  wave: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2h2" />
      <path d="M12 2v20" />
      <path d="M4 7c1.5 1 3 2.5 3 5s-1.5 4-3 5" />
      <path d="M20 7c-1.5 1-3 2.5-3 5s1.5 4 3 5" />
    </svg>
  ),
  gear: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  bluetooth: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
    </svg>
  ),
};

export interface SidebarItemProps {
  icon: keyof typeof iconMap;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "sidebar-item",
        active && "active text-accent"
      )}
    >
      <span className={cn(!active && "text-text-soft")}>
        {iconMap[icon]}
      </span>
      <span>{label}</span>
    </div>
  );
}

export interface SidebarProps {
  children?: ReactNode;
  logo?: ReactNode;
  title?: string;
  tagline?: string;
  footer?: ReactNode;
}

export function Sidebar({ children, logo, title, tagline, footer }: SidebarProps) {
  return (
    <div className="sidebar bg-surface/50">
      {/* Header: traffic lights + drag region */}
      <div className="h-10 flex items-center px-3.5 relative">
        {/* Drag region behind buttons */}
        <div className="absolute inset-0" data-tauri-drag-region />
        {/* macOS traffic lights (above drag region) */}
        <div className="flex gap-2 relative z-10">
          <button
            onClick={winClose}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 focus:outline-none cursor-default"
            aria-label="Close"
          />
          <button
            onClick={winMinimize}
            className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 focus:outline-none cursor-default"
            aria-label="Minimize"
          />
          <button
            disabled
            className="w-3 h-3 rounded-full bg-[#28c840] opacity-30 focus:outline-none cursor-default"
            aria-label="Maximize Disabled"
          />
        </div>
      </div>

      {/* Logo & Title */}
      {(logo || title) && (
        <div className="px-3.5 pb-1.5 pt-3 flex items-center gap-2">
          {logo && (
            <div className="w-[22px] h-[22px] rounded-md bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-[0_1px_6px_var(--accent-40)]">
              {logo}
            </div>
          )}
          {title && (
            <span className="font-display text-sm font-bold tracking-tight">
              {title}
            </span>
          )}
        </div>
      )}

      {/* Tagline */}
      {tagline && (
        <div className="px-3.5 pb-3 font-mono text-[9.5px] text-text-muted tracking-wider uppercase">
          {tagline}
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1">
        {children}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="p-3 border-t border-border-soft font-mono text-[10px] text-text-muted">
          {footer}
        </div>
      )}
    </div>
  );
}
