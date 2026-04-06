import { readDir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { FileNode } from "../types";

const IGNORE = new Set([".git", "node_modules", "__pycache__", ".next", "target", "dist", ".DS_Store"]);

export async function listDir(dirPath: string): Promise<FileNode[]> {
  let entries;
  try {
    entries = await readDir(dirPath);
  } catch (e) {
    console.error("readDir failed for:", dirPath, e);
    return [];
  }

  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue;
    const path = `${dirPath}/${entry.name}`;
    if (entry.isDirectory) {
      nodes.push({ id: path, name: entry.name, isDir: true });
    } else {
      nodes.push({ id: path, name: entry.name, isDir: false });
    }
  }

  nodes.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

export async function readFile(path: string): Promise<string> {
  return readTextFile(path);
}

export async function writeFile(path: string, contents: string): Promise<void> {
  await writeTextFile(path, contents);
}
