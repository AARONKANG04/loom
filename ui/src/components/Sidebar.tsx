import { useState, useCallback, useRef } from "react";
import FileTree from "./FileTree";
import type { FileNode } from "../types";

const MIN_WIDTH = 0;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 240;

interface SidebarProps {
  treeData: FileNode[];
  rootPath: string | null;
  onOpenFolder: () => void;
  onFileSelect: (node: FileNode) => void;
}

export default function Sidebar({ treeData, rootPath, onOpenFolder, onFileSelect }: SidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const folderName = rootPath?.split("/").pop() ?? null;

  return (
    <>
      <div className="h-full flex-shrink-0 overflow-hidden bg-sidebar border-r border-border" style={{ width }}>
        <div className="flex flex-col select-none w-60 h-full">
          <div className="px-4 py-3 text-[11px] font-semibold tracking-wide text-text-muted flex items-center justify-between">
            <span>{folderName ? folderName.toUpperCase() : "EXPLORER"}</span>
            <button
              onClick={onOpenFolder}
              className="text-text-muted hover:text-text text-[16px] leading-none cursor-pointer"
              title="Open Folder"
            >
              +
            </button>
          </div>
          {!rootPath ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <button
                onClick={onOpenFolder}
                className="px-4 py-2 bg-text text-white text-[12px] rounded hover:opacity-80 cursor-pointer"
              >
                Open Folder
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <FileTree entries={treeData} onFileSelect={onFileSelect} />
            </div>
          )}
        </div>
      </div>
      <div
        onMouseDown={onMouseDown}
        className="w-1 h-full flex-shrink-0 cursor-col-resize hover:bg-blue-400 active:bg-blue-400 z-10"
      />
    </>
  );
}
