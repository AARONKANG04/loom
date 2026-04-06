import { useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { getLanguageFromPath } from "../lib/languageMap";
import type { TabData } from "../types";

interface EditorPanelProps {
  tabs: TabData[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onEditorChange: (tabId: string, content: string) => void;
  onSave: (tabId: string) => void;
}

export default function EditorPanel({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onEditorChange,
  onSave,
}: EditorPanelProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

  const handleMount: OnMount = (editor, monaco) => {
    editor.addAction({
      id: "save-file",
      label: "Save File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        if (activeTabIdRef.current) saveRef.current(activeTabIdRef.current);
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="h-9 min-h-9 bg-header border-b border-border flex items-center px-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`flex items-center gap-1 px-3 h-full text-[12px] border-r border-border cursor-pointer shrink-0
              ${tab.id === activeTabId ? "bg-surface text-text" : "text-text-muted hover:text-text"}`}
          >
            <span className="truncate max-w-40">{tab.name}</span>
            {tab.dirty && <span className="text-[10px]">{"\u25CF"}</span>}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="ml-1 text-text-muted hover:text-text text-[14px] leading-none"
            >
              {"\u00D7"}
            </span>
          </button>
        ))}
      </div>
      <div className="flex-1 bg-surface min-h-0">
        {activeTab ? (
          <Editor
            value={activeTab.content}
            language={getLanguageFromPath(activeTab.id)}
            path={activeTab.id}
            theme="light"
            height="100%"
            onChange={(value) => onEditorChange(activeTab.id, value ?? "")}
            onMount={handleMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 8 },
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-text-muted text-[13px]">
            Open a file to start editing
          </div>
        )}
      </div>
    </div>
  );
}
