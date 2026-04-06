import { useState, useCallback, useRef, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import EditorPanel from "./components/EditorPanel";
import Terminal from "./components/Terminal";
import AgentPanel from "./components/AgentPanel";
import TitleBar from "./components/TitleBar";
import { listDir, readFile, writeFile } from "./lib/fs";
import { startBackend, stopBackend } from "./lib/backend";
import type { FileNode, TabData } from "./types";
import "./app.css";

function App() {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const backendDir = await invoke<string>("get_backend_dir");
        if (!cancelled) await startBackend(backendDir);
      } catch (err) {
        console.error("Failed to start backend:", err);
      }
    })();
    return () => {
      cancelled = true;
      stopBackend();
    };
  }, []);

  const handleOpenFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false, title: "Open Folder" });
    if (!selected) return;
    const path = typeof selected === "string" ? selected : String(selected);
    setRootPath(path);
    const entries = await listDir(path);
    setTreeData(entries);
    setTabs([]);
    setActiveTabId(null);
  }, []);

  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (node.isDir) return;
    const existing = tabsRef.current.find((t) => t.id === node.id);
    if (existing) {
      setActiveTabId(node.id);
      return;
    }
    const content = await readFile(node.id);
    setTabs((prev) => [...prev, { id: node.id, name: node.name, content, dirty: false }]);
    setActiveTabId(node.id);
  }, []);

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      const next = prev.filter((t) => t.id !== tabId);
      setActiveTabId((currentActive) => {
        if (currentActive === tabId) {
          return next[Math.min(idx, next.length - 1)]?.id ?? null;
        }
        return currentActive;
      });
      return next;
    });
  }, []);

  const handleEditorChange = useCallback((tabId: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content, dirty: true } : t))
    );
  }, []);

  const handleSave = useCallback(async (tabId: string) => {
    const tab = tabsRef.current.find((t) => t.id === tabId);
    if (!tab) return;
    await writeFile(tab.id, tab.content);
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, dirty: false } : t))
    );
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg text-text font-sans text-[13px]">
      <TitleBar onOpenFolder={handleOpenFolder} />
      <div className="flex flex-1 min-h-0">
      <Sidebar
        treeData={treeData}
        rootPath={rootPath}
        onOpenFolder={handleOpenFolder}
        onFileSelect={handleFileSelect}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <EditorPanel
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
          onEditorChange={handleEditorChange}
          onSave={handleSave}
        />
        <Terminal rootPath={rootPath} />
      </div>
      <AgentPanel />
      </div>
    </div>
  );
}

export default App;
