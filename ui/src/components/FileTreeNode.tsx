import type { NodeRendererProps } from "react-arborist";
import type { FileNode } from "../types";

export default function FileTreeNode({ node, style }: NodeRendererProps<FileNode>) {
  const isFolder = !node.isLeaf;

  return (
    <div
      style={style}
      className={`flex items-center gap-1 px-2 cursor-pointer truncate h-full
        ${node.isSelected ? "bg-black/10" : "hover:bg-black/5"}`}
    >
      <span className="text-text-muted text-[11px] w-4 flex-shrink-0 text-center">
        {isFolder ? (node.isOpen ? "\u25BE" : "\u25B8") : ""}
      </span>
      <span className="truncate">{node.data.name}</span>
    </div>
  );
}
