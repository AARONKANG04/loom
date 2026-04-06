import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

interface TitleBarProps {
  onOpenFolder?: () => void;
}

export default function TitleBar({ onOpenFolder }: TitleBarProps) {
  return (
    <div
      data-tauri-drag-region
      className="h-9 min-h-9 flex items-center justify-between bg-header border-b border-border select-none"
    >
      <div data-tauri-drag-region className="flex-1 pl-3 flex items-center gap-2">
        <span data-tauri-drag-region className="text-[12px] font-medium text-text-muted">Loom</span>
        {onOpenFolder && (
          <button
            onClick={onOpenFolder}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-text-muted hover:text-text hover:bg-white/5 rounded cursor-pointer"
            title="Open Folder"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 14h13a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-.5-.5H7.71a.5.5 0 0 1-.36-.15L6.15 2.15a.5.5 0 0 0-.36-.15H1.5a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5z" />
            </svg>
            <span>Open Folder</span>
          </button>
        )}
      </div>
      <div className="flex items-center">
        <button
          onClick={() => appWindow.minimize()}
          className="w-11 h-9 flex items-center justify-center text-text-muted hover:bg-black/10 cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5" width="12" height="1.5" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="w-11 h-9 flex items-center justify-center text-text-muted hover:bg-black/10 cursor-pointer"
        >
          <svg width="11" height="11" viewBox="0 0 11 11">
            <rect x="0.5" y="0.5" width="10" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          onClick={() => appWindow.close()}
          className="w-11 h-9 flex items-center justify-center text-text-muted hover:bg-red-500 hover:text-white cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
