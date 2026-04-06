import { useState, useCallback, useRef, useEffect } from "react";
import { getBackendPort } from "../lib/backend";
import { getSetting, setSetting } from "../lib/store";
import { PROVIDERS, PROVIDER_MODELS, getModelDefByName } from "../lib/models";

interface BackendStatus {
  status: string;
  uptime_seconds: number;
  memory_bytes: number;
  pid: number;
}

const MIN_WIDTH = 0;
const MAX_WIDTH = 1200;
const DEFAULT_WIDTH = 420;

type EditMode = "ask" | "auto";
type SettingsTab = "models" | "general";

interface Message {
  role: "user" | "agent";
  content: string;
}

export default function AgentPanel() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [editMode, setEditMode] = useState<EditMode>("ask");
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [reasoning, setReasoning] = useState("medium");
  const [showReasoningMenu, setShowReasoningMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [model, setModel] = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("models");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [displayedProvider, setDisplayedProvider] = useState<string | null>(null);
  const [providerCollapsed, setProviderCollapsed] = useState(false);
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [customProvider, setCustomProvider] = useState({ name: "", baseUrl: "", apiKey: "" });
  const [enabledModels, setEnabledModels] = useState<Record<string, string[]>>({});
  const [discoveredModels, setDiscoveredModels] = useState<{ id: string; name: string }[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [showDefaultModelMenu, setShowDefaultModelMenu] = useState(false);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reasoningRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const defaultModelRef = useRef<HTMLDivElement>(null);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      const [keys, custom, m, em, r, dm, mt, enm, disc] = await Promise.all([
        getSetting<Record<string, string>>("providerKeys"),
        getSetting<{ name: string; baseUrl: string; apiKey: string }>("customProvider"),
        getSetting<string>("model"),
        getSetting<EditMode>("editMode"),
        getSetting<string>("reasoning"),
        getSetting<string>("defaultModel"),
        getSetting<number>("maxTokens"),
        getSetting<Record<string, string[]>>("enabledModels"),
        getSetting<{ id: string; name: string }[]>("discoveredModels"),
      ]);
      if (keys) setProviderKeys(keys);
      if (custom) setCustomProvider(custom);
      if (m) setModel(m);
      if (em) setEditMode(em);
      if (r) setReasoning(r);
      if (dm) setDefaultModel(dm);
      if (mt) setMaxTokens(mt);
      if (enm) setEnabledModels(enm);
      if (disc) setDiscoveredModels(disc);
      setSettingsLoaded(true);
    })();
  }, []);

  // Persist settings when they change
  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("providerKeys", providerKeys);
  }, [providerKeys, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("customProvider", customProvider);
  }, [customProvider, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("enabledModels", enabledModels);
  }, [enabledModels, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("discoveredModels", discoveredModels);
  }, [discoveredModels, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("model", model);
  }, [model, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("editMode", editMode);
  }, [editMode, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("reasoning", reasoning);
  }, [reasoning, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("defaultModel", defaultModel);
  }, [defaultModel, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    setSetting("maxTokens", maxTokens);
  }, [maxTokens, settingsLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!showEditMenu && !showReasoningMenu && !showAddMenu && !showModelMenu && !showDefaultModelMenu) return;
    const handler = (e: MouseEvent) => {
      if (showEditMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) setShowEditMenu(false);
      if (showReasoningMenu && reasoningRef.current && !reasoningRef.current.contains(e.target as Node)) setShowReasoningMenu(false);
      if (showAddMenu && addRef.current && !addRef.current.contains(e.target as Node)) setShowAddMenu(false);
      if (showModelMenu && modelRef.current && !modelRef.current.contains(e.target as Node)) setShowModelMenu(false);
      if (showDefaultModelMenu && defaultModelRef.current && !defaultModelRef.current.contains(e.target as Node)) setShowDefaultModelMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEditMenu, showReasoningMenu, showAddMenu, showModelMenu, showDefaultModelMenu]);

  useEffect(() => {
    if (displayedProvider && expandedProvider && expandedProvider !== displayedProvider) {
      // Switching between any two providers: collapse, swap, expand
      setProviderCollapsed(true);
      const t = setTimeout(() => {
        setDisplayedProvider(expandedProvider);
        setProviderCollapsed(false);
      }, 200);
      return () => clearTimeout(t);
    }
    setDisplayedProvider(expandedProvider);
  }, [expandedProvider]);

  // Compute all enabled models grouped by provider for dropdowns
  const allEnabledModels: { provider: string; id: string; name: string }[] = [];
  for (const p of PROVIDERS) {
    const enabled = enabledModels[p.id] || [];
    const models = PROVIDER_MODELS[p.id] || [];
    for (const m of models) {
      if (enabled.includes(m.id)) allEnabledModels.push({ provider: p.name, id: m.id, name: m.name });
    }
  }
  // Custom provider models
  const customEnabled = enabledModels["custom"] || [];
  for (const m of discoveredModels) {
    if (customEnabled.includes(m.id)) {
      allEnabledModels.push({ provider: customProvider.name || "Custom", id: m.id, name: m.name });
    }
  }

  // Clear selected models if they're no longer enabled
  useEffect(() => {
    const enabledNames = new Set(allEnabledModels.map((m) => m.name));
    if (model && !enabledNames.has(model)) setModel("");
    if (defaultModel && !enabledNames.has(defaultModel)) setDefaultModel("");
  }, [enabledModels, discoveredModels]);

  const openSettings = useCallback(() => {
    setShowSettings(true);
    requestAnimationFrame(() => setSettingsVisible(true));
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsVisible(false);
    setTimeout(() => setShowSettings(false), 200);
  }, []);

  useEffect(() => {
    if (!showSettings) {
      setBackendStatus(null);
      return;
    }
    const port = getBackendPort();
    if (!port) return;

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/status`);
    ws.onmessage = (e) => {
      try { setBackendStatus(JSON.parse(e.data)); } catch { /* ignore */ }
    };
    ws.onerror = () => setBackendStatus(null);
    ws.onclose = () => setBackendStatus(null);
    return () => ws.close();
  }, [showSettings]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Agent support coming soon." },
      ]);
    }, 500);
  }, [input]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const fromRight = window.innerWidth - e.clientX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, fromRight)));
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

  const hasMessages = messages.length > 0;

  return (
    <>
      <div
        onMouseDown={onMouseDown}
        className="w-1 h-full flex-shrink-0 cursor-col-resize hover:bg-blue-400 active:bg-blue-400 z-10"
      />
      <div
        className="h-full flex-shrink-0 overflow-hidden bg-sidebar border-l border-border flex flex-col"
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center pt-6 pb-2 px-4">
          <div className="flex-1" />
          <div className="flex items-center">
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none" className="mr-1.5">
              <path d="M50 5 C70 5, 90 20, 90 45 C90 65, 75 80, 55 75 C38 71, 25 58, 30 42 C34 30, 45 24, 55 30 C62 35, 62 45, 55 50 C50 53, 45 50, 46 46" stroke="#222" strokeWidth="5" strokeLinecap="round" fill="none" />
            </svg>
            <span className="text-[16px] font-semibold tracking-tight text-text">
              Loom
            </span>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={openSettings}
              className="flex items-center justify-center w-9 h-9 rounded-md cursor-pointer text-text-muted hover:text-text hover:bg-header"
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages or welcome */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!hasMessages ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
              <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
                <path d="M50 5 C70 5, 90 20, 90 45 C90 65, 75 80, 55 75 C38 71, 25 58, 30 42 C34 30, 45 24, 55 30 C62 35, 62 45, 55 50 C50 53, 45 50, 46 46" stroke="#222" strokeWidth="4" strokeLinecap="round" fill="none" />
              </svg>
              <p className="text-center text-[13px] leading-relaxed text-text-muted">
                Your AI coding assistant. Ask me to explain, edit, or generate code.
              </p>
            </div>
          ) : (
            <div className="flex-1 px-4 py-3 flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-text text-white rounded-br-sm"
                        : "bg-header text-text rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input + toolbar card */}
        <div className="px-3 pb-3 pt-1 relative">
          <div className="bg-surface border border-border rounded-xl">
            {/* Input */}
            <div className="px-4 pt-4 pb-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={3}
                placeholder="Ask Loom..."
                className="w-full bg-transparent text-[15px] text-text outline-none placeholder:text-text-muted resize-none"
              ></textarea>
            </div>

            {/* Toolbar */}
            <div className="flex items-center px-3 pb-3 gap-1">
              {/* Add file */}
              <div className="relative" ref={addRef}>
                {showAddMenu && (
                  <div className="absolute bottom-10 left-0 bg-surface border border-border rounded-lg shadow-lg py-1.5 min-w-[200px] z-20">
                    <button
                      onClick={() => setShowAddMenu(false)}
                      className="w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header text-text-muted hover:text-text flex items-center gap-3"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      Upload from computer
                    </button>
                    <button
                      onClick={() => setShowAddMenu(false)}
                      className="w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header text-text-muted hover:text-text flex items-center gap-3"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6M12 18v-6M9 15h6" />
                      </svg>
                      Add context
                    </button>
                    <button
                      onClick={() => setShowAddMenu(false)}
                      className="w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header text-text-muted hover:text-text flex items-center gap-3"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      Browse the web
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowAddMenu((v) => !v)}
                  className="flex items-center justify-center w-9 h-9 rounded-md cursor-pointer text-text-muted hover:text-text hover:bg-header"
                  title="Add file"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* Reasoning level */}
              {(() => {
                const REASONING_COLORS: Record<string, string> = {
                  minimal: "#9ca3af",
                  none: "#9ca3af",
                  low: "#22c55e",
                  medium: "#eab308",
                  high: "#f97316",
                  max: "#ef4444",
                };
                const isCustomModel = !!(model && allEnabledModels.find((m) => m.name === model && m.provider === (customProvider.name || "Custom")));
                const modelDef = model ? getModelDefByName(model) : undefined;
                const reasoningType = modelDef?.reasoning.type ?? "none";
                const isOff = !model || isCustomModel || reasoningType === "none";
                const isAlways = reasoningType === "always";
                const hasLevels = reasoningType === "levels";
                const levels = hasLevels && modelDef?.reasoning.type === "levels" ? modelDef.reasoning.levels : [];
                const activeColor = isAlways ? "#f97316" : (hasLevels ? (REASONING_COLORS[reasoning] ?? "#9ca3af") : undefined);
                return (
                  <div className="relative" ref={reasoningRef}>
                    {/* Level picker for models with configurable levels */}
                    {showReasoningMenu && hasLevels && (
                      <div className="absolute bottom-10 left-0 bg-surface border border-border rounded-lg shadow-lg py-1.5 min-w-[140px] z-20">
                        {levels.map((level) => (
                          <button
                            key={level}
                            onClick={() => { setReasoning(level); setShowReasoningMenu(false); }}
                            className={`w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header flex items-center gap-2 capitalize ${
                              reasoning === level ? "text-text font-medium" : "text-text-muted"
                            }`}
                          >
                            {reasoning === level && <span className="text-blue-500">&#10003;</span>}
                            <span className={reasoning === level ? "" : "ml-5"}>{level}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* "Always on" tooltip for always-reasoning models */}
                    {showReasoningMenu && isAlways && (
                      <div className="absolute bottom-10 left-0 bg-surface border border-border rounded-lg shadow-lg px-4 py-3 min-w-[200px] z-20">
                        <p className="text-[13px] text-text font-medium">Always-on reasoning</p>
                        <p className="text-[11px] text-text-muted mt-1">This model always uses reasoning. It can't be turned off or adjusted.</p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (isOff) return;
                        setShowReasoningMenu((v) => !v);
                      }}
                      className={`flex items-center justify-center w-9 h-9 rounded-md relative transition-colors ${
                        isOff
                          ? "opacity-35 cursor-not-allowed"
                          : "cursor-pointer hover:opacity-80"
                      }`}
                      style={!isOff && activeColor ? { backgroundColor: activeColor + "20", color: activeColor } : undefined}
                      title={
                        isOff ? "Reasoning not available for this model"
                          : isAlways ? "This model always reasons"
                          : `Reasoning: ${reasoning}`
                      }
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.8-1.6 5-4 6.3V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.7C6.6 14 5 11.8 5 9a7 7 0 0 1 7-7z" />
                        <path d="M9 21h6M10 17v4M14 17v4" />
                      </svg>
                      {isOff && (
                        <svg width="24" height="24" viewBox="0 0 24 24" className="absolute inset-0 m-auto" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="4" y1="4" x2="20" y2="20" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })()}

              {/* Model selector */}
              <div className="relative" ref={modelRef}>
                {showModelMenu && (
                  <div className="absolute bottom-10 left-0 bg-surface border border-border rounded-lg shadow-lg py-1.5 min-w-[220px] z-20 max-h-[300px] overflow-y-auto">
                    {allEnabledModels.length === 0 ? (
                      <div className="px-4 py-3 text-[12px] text-text-muted">
                        No models enabled. Open Settings to configure providers.
                      </div>
                    ) : (
                      (() => {
                        const groups: Record<string, typeof allEnabledModels> = {};
                        for (const m of allEnabledModels) {
                          (groups[m.provider] ??= []).push(m);
                        }
                        return Object.entries(groups).map(([provider, models]) => (
                          <div key={provider}>
                            <div className="px-3.5 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wide">{provider}</div>
                            {models.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => { setModel(m.name); setShowModelMenu(false); }}
                                className={`w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header flex items-center gap-2 ${
                                  model === m.name ? "text-text font-medium" : "text-text-muted"
                                }`}
                              >
                                {model === m.name ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                ) : (
                                  <span className="w-[13px] shrink-0" />
                                )}
                                {m.name}
                              </button>
                            ))}
                          </div>
                        ));
                      })()
                    )}
                  </div>
                )}
                <button
                  onClick={() => setShowModelMenu((v) => !v)}
                  className="flex items-center gap-1.5 h-9 px-2.5 rounded-md cursor-pointer text-text-muted hover:text-text hover:bg-header text-[13px]"
                  title="Select model"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                  <span className={model ? "" : "text-text-muted"}>{model || "None"}</span>
                </button>
              </div>

              <div className="flex-1" />

              {/* Edit mode dropup */}
              <div className="relative" ref={menuRef}>
                {showEditMenu && (
                  <div className="absolute bottom-10 right-0 bg-surface border border-border rounded-lg shadow-lg py-1.5 min-w-[200px] z-20">
                    <button
                      onClick={() => { setEditMode("ask"); setShowEditMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header flex items-center gap-2 ${
                        editMode === "ask" ? "text-text font-medium" : "text-text-muted"
                      }`}
                    >
                      {editMode === "ask" && <span className="text-blue-500">&#10003;</span>}
                      <span className={editMode === "ask" ? "" : "ml-5"}>Ask before editing</span>
                    </button>
                    <button
                      onClick={() => { setEditMode("auto"); setShowEditMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header flex items-center gap-2 ${
                        editMode === "auto" ? "text-text font-medium" : "text-text-muted"
                      }`}
                    >
                      {editMode === "auto" && <span className="text-blue-500">&#10003;</span>}
                      <span className={editMode === "auto" ? "" : "ml-5"}>Edit automatically</span>
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowEditMenu((v) => !v)}
                  className="flex items-center gap-1.5 px-2.5 h-9 rounded-md cursor-pointer text-text-muted hover:text-text hover:bg-header text-[13px]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  <span>{editMode === "ask" ? "Ask before editing" : "Edit automatically"}</span>
                </button>
              </div>

              {/* Send */}
              <button
                onClick={handleSend}
                className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer bg-text text-surface hover:opacity-80 ml-1"
                title="Send"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${settingsVisible ? "opacity-100" : "opacity-0"}`}
          onClick={closeSettings}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className={`relative bg-surface border border-border rounded-2xl shadow-xl w-[85vw] max-w-[900px] h-[85vh] max-h-[850px] flex flex-col transition-all duration-200 ${settingsVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-0">
              <h2 className="text-[18px] font-semibold text-text">Settings</h2>
              <button
                onClick={closeSettings}
                className="flex items-center justify-center w-9 h-9 rounded-md cursor-pointer text-text-muted hover:text-text hover:bg-header"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 px-8 mt-4 border-b border-border">
              {(["models", "general"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSettingsTab(tab)}
                  className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer border-b-2 transition-colors ${
                    settingsTab === tab
                      ? "border-text text-text"
                      : "border-transparent text-text-muted hover:text-text"
                  }`}
                >
                  {tab === "models" ? "Models" : "General"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-8 py-6">
              {settingsTab === "models" ? (
                <div className="flex flex-col gap-5">
                  <p className="text-[13px] text-text-muted">
                    Connect an AI provider to start using Loom. Just add your API key.
                  </p>

                  {/* Provider cards grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {PROVIDERS.map((p) => {
                      const isExpanded = expandedProvider === p.id;
                      const hasKey = !!providerKeys[p.id];
                      return (
                        <button
                          key={p.id}
                          onClick={() => setExpandedProvider(isExpanded ? null : p.id)}
                          className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isExpanded
                              ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-100"
                              : "border-border bg-bg hover:border-blue-200"
                          }`}
                        >
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-white text-[14px] font-bold shrink-0"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.name[0]}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-text">{p.name}</span>
                              {hasKey && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted">{p.description}</span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom provider card */}
                    <button
                      onClick={() => setExpandedProvider(expandedProvider === "custom" ? null : "custom")}
                      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        expandedProvider === "custom"
                          ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-100"
                          : "border-border bg-bg hover:border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-text-muted text-white shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-text">Custom / Local</span>
                          {(customProvider.baseUrl || customProvider.apiKey) && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[11px] text-text-muted">Ollama, LM Studio, or any OpenAI-compatible server</span>
                      </div>
                    </button>
                  </div>

                  {/* Expanded config panel */}
                  <div className={`grid transition-all duration-200 ease-out ${expandedProvider && expandedProvider !== "custom" && !providerCollapsed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-3 p-4 bg-bg border border-border rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-text">
                            {PROVIDERS.find((p) => p.id === displayedProvider)?.name} API Key
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={displayedProvider && showKey[displayedProvider] ? "text" : "password"}
                            value={(displayedProvider && providerKeys[displayedProvider]) || ""}
                            onChange={(e) =>
                              displayedProvider && setProviderKeys((prev) => ({ ...prev, [displayedProvider]: e.target.value }))
                            }
                            placeholder={PROVIDERS.find((p) => p.id === displayedProvider)?.placeholder}
                            className="w-full px-3.5 py-2.5 pr-10 text-[14px] bg-surface border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                          />
                          <button
                            onClick={() =>
                              displayedProvider && setShowKey((prev) => ({ ...prev, [displayedProvider]: !prev[displayedProvider] }))
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
                            title={displayedProvider && showKey[displayedProvider] ? "Hide key" : "Show key"}
                          >
                            {displayedProvider && showKey[displayedProvider] ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-text-muted">
                          Your key is stored locally and never sent anywhere except the provider.
                        </p>

                        {/* Model toggles */}
                        {displayedProvider && PROVIDER_MODELS[displayedProvider] && (
                          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border">
                            <span className="text-[12px] font-medium text-text-muted">Available Models</span>
                            <div className="flex flex-col gap-1">
                              {PROVIDER_MODELS[displayedProvider].map((m) => {
                                const enabled = enabledModels[displayedProvider]?.includes(m.id) ?? false;
                                return (
                                  <button
                                    key={m.id}
                                    onClick={() =>
                                      setEnabledModels((prev) => {
                                        const current = prev[displayedProvider!] || [];
                                        return {
                                          ...prev,
                                          [displayedProvider!]: enabled
                                            ? current.filter((id) => id !== m.id)
                                            : [...current, m.id],
                                        };
                                      })
                                    }
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-surface transition-colors text-left"
                                  >
                                    <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                                      enabled ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-surface"
                                    }`}>
                                      {enabled && (
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className={`text-[14px] ${enabled ? "text-text font-semibold" : "text-text"}`}>
                                      {m.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              Enabled models appear in the model picker.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom provider expanded config */}
                  <div className={`grid transition-all duration-200 ease-out ${expandedProvider === "custom" && !providerCollapsed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-3 p-4 bg-bg border border-border rounded-xl">
                        <span className="text-[13px] font-semibold text-text mb-1">Connect a custom provider</span>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-text-muted">Display Name</label>
                          <input
                            type="text"
                            value={customProvider.name}
                            onChange={(e) => setCustomProvider((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. My Ollama"
                            className="w-full px-3.5 py-2.5 text-[14px] bg-surface border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-text-muted">Server URL</label>
                          <input
                            type="text"
                            value={customProvider.baseUrl}
                            onChange={(e) => setCustomProvider((prev) => ({ ...prev, baseUrl: e.target.value }))}
                            placeholder="http://localhost:11434/v1"
                            className="w-full px-3.5 py-2.5 text-[14px] bg-surface border border-border rounded-lg outline-none focus:border-blue-400 text-text font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-text-muted">API Key (optional)</label>
                          <input
                            type="password"
                            value={customProvider.apiKey}
                            onChange={(e) => setCustomProvider((prev) => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="Leave blank if not needed"
                            className="w-full px-3.5 py-2.5 text-[14px] bg-surface border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                          />
                        </div>

                        <p className="text-[11px] text-text-muted">
                          Works with any server that speaks the OpenAI API format.
                        </p>

                        {/* Discover models button + results */}
                        {customProvider.baseUrl && (
                          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  setDiscovering(true);
                                  try {
                                    const url = customProvider.baseUrl.replace(/\/$/, "") + "/models";
                                    const headers: Record<string, string> = {};
                                    if (customProvider.apiKey) headers["Authorization"] = `Bearer ${customProvider.apiKey}`;
                                    const res = await fetch(url, { headers });
                                    const json = await res.json();
                                    const models = (json.data || []).map((m: { id: string }) => ({
                                      id: m.id,
                                      name: m.id,
                                    }));
                                    setDiscoveredModels(models);
                                  } catch {
                                    setDiscoveredModels([]);
                                  }
                                  setDiscovering(false);
                                }}
                                disabled={discovering}
                                className="px-3 py-1.5 text-[12px] font-medium bg-surface border border-border rounded-lg cursor-pointer hover:border-blue-300 transition-colors disabled:opacity-50 text-text"
                              >
                                {discovering ? "Discovering..." : "Discover Models"}
                              </button>
                              {discoveredModels.length > 0 && (
                                <span className="text-[11px] text-text-muted">
                                  {discoveredModels.length} model{discoveredModels.length !== 1 ? "s" : ""} found
                                </span>
                              )}
                            </div>

                            {discoveredModels.length > 0 && (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={modelSearch}
                                  onChange={(e) => setModelSearch(e.target.value)}
                                  placeholder="Search models..."
                                  className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                                />
                              <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
                                {discoveredModels.filter((m) => m.name.toLowerCase().includes(modelSearch.toLowerCase())).map((m) => {
                                  const enabled = enabledModels["custom"]?.includes(m.id) ?? false;
                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() =>
                                        setEnabledModels((prev) => {
                                          const current = prev["custom"] || [];
                                          return {
                                            ...prev,
                                            custom: enabled
                                              ? current.filter((id) => id !== m.id)
                                              : [...current, m.id],
                                          };
                                        })
                                      }
                                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-surface transition-colors text-left"
                                    >
                                      <div className={`flex items-center justify-center w-4.5 h-4.5 rounded border transition-colors ${
                                        enabled ? "bg-blue-500 border-blue-500" : "border-border bg-surface"
                                      }`}>
                                        {enabled && (
                                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6L9 17l-5-5" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className={`text-[14px] ${enabled ? "text-text font-semibold" : "text-text"}`}>
                                        {m.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* General tab */
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-text">Default Model</label>
                    <div className="relative" ref={defaultModelRef}>
                      <button
                        onClick={() => setShowDefaultModelMenu((v) => !v)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] bg-bg border border-border rounded-lg outline-none text-text cursor-pointer hover:border-blue-300 transition-colors"
                      >
                        <span className={defaultModel ? "" : "text-text-muted"}>{defaultModel || "None"}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-text-muted transition-transform duration-150 ${showDefaultModelMenu ? "rotate-180" : ""}`}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      {showDefaultModelMenu && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 z-30 max-h-[260px] overflow-y-auto">
                          {allEnabledModels.length === 0 ? (
                            <div className="px-3.5 py-3 text-[12px] text-text-muted">
                              No models enabled. Go to Models tab to configure.
                            </div>
                          ) : (
                            (() => {
                              const groups: Record<string, typeof allEnabledModels> = {};
                              for (const m of allEnabledModels) {
                                (groups[m.provider] ??= []).push(m);
                              }
                              return Object.entries(groups).map(([provider, models]) => (
                                <div key={provider}>
                                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wide">{provider}</div>
                                  {models.map((m) => (
                                    <button
                                      key={m.id}
                                      onClick={() => { setDefaultModel(m.name); setShowDefaultModelMenu(false); }}
                                      className={`w-full text-left px-3.5 py-2 text-[13px] cursor-pointer hover:bg-header flex items-center gap-2 ${
                                        defaultModel === m.name ? "text-text font-medium" : "text-text-muted"
                                      }`}
                                    >
                                      {defaultModel === m.name ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0">
                                          <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                      ) : (
                                        <span className="w-[14px] shrink-0" />
                                      )}
                                      {m.name}
                                    </button>
                                  ))}
                                </div>
                              ));
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-text">Max Tokens</label>
                    <input
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      className="px-3.5 py-2.5 text-[14px] bg-bg border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                    />
                  </div>

                  {/* Backend Status */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-medium text-text">Backend</label>
                    {backendStatus ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-bg border border-border rounded-xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-green-600">Running</span>
                          <span className="text-[11px] text-text-muted">
                            Uptime {Math.floor(backendStatus.uptime_seconds / 60)}m {backendStatus.uptime_seconds % 60}s
                            {" \u00B7 "}
                            {(backendStatus.memory_bytes / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-bg border border-border rounded-xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="text-[13px] font-medium text-red-500">Not running</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
