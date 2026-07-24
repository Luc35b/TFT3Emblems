import { Settings } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
        <button className="header-button" data-tauri-drag-region="false">
          <Settings className="header-button-icon" />
        </button>
      </div>
    </header>
  );
}
