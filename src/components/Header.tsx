import { ChevronDown, ChevronUp, Settings } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

export function Header({ title, subtitle, isCollapsed, onCollapse }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
        {onCollapse ? (
          <button
            className="header-button"
            data-tauri-drag-region="false"
            onClick={onCollapse}
            aria-label={isCollapsed ? "Expand overlay" : "Collapse overlay"}
          >
            {isCollapsed ? <ChevronDown className="header-button-icon" /> : <ChevronUp className="header-button-icon" />}
          </button>
        ) : (
          <button className="header-button" data-tauri-drag-region="false">
            <Settings className="header-button-icon" />
          </button>
        )}
      </div>
    </header>
  );
}
