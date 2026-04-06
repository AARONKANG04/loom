import { useState } from "react";
import { listDir } from "../lib/fs";
import type { FileNode } from "../types";

interface FileTreeProps {
  entries: FileNode[];
  depth?: number;
  onFileSelect: (node: FileNode) => void;
}

export default function FileTree({ entries, depth = 0, onFileSelect }: FileTreeProps) {
  return (
    <div>
      {entries.map((entry) =>
        entry.isDir ? (
          <FolderNode key={entry.id} node={entry} depth={depth} onFileSelect={onFileSelect} />
        ) : (
          <div
            key={entry.id}
            onClick={() => onFileSelect(entry)}
            className="flex items-center gap-1 px-2 py-0.5 cursor-pointer truncate hover:bg-black/5"
            style={{ paddingLeft: depth * 16 + 8 }}
          >
            <span className="w-4" />
            <span className="truncate">{entry.name}</span>
          </div>
        )
      )}
    </div>
  );
}

function FolderNode({
  node,
  depth,
  onFileSelect,
}: {
  node: FileNode;
  depth: number;
  onFileSelect: (node: FileNode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<FileNode[] | null>(null);

  const toggle = async () => {
    if (!open && children === null) {
      const entries = await listDir(node.id);
      setChildren(entries);
    }
    setOpen((o) => !o);
  };

  return (
    <div>
      <div
        onClick={toggle}
        className="flex items-center gap-1 px-2 py-0.5 cursor-pointer truncate hover:bg-black/5"
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        <span className="text-text-muted text-[11px] w-4 flex-shrink-0 text-center">
          {open ? "\u25BE" : "\u25B8"}
        </span>
        <span className="truncate">{node.name}</span>
      </div>
      {open && children && (
        <FileTree entries={children} depth={depth + 1} onFileSelect={onFileSelect} />
      )}
    </div>
  );
}
