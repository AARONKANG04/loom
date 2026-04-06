import { useState, useCallback, useRef, useEffect } from "react";

const MIN_WIDTH = 0;
const MAX_WIDTH = 1200;
const DEFAULT_WIDTH = 420;

type EditMode = "ask" | "auto";

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
  const [reasoning, setReasoning] = useState<"none" | "low" | "medium" | "high">("medium");
  const [showReasoningMenu, setShowReasoningMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [model, setModel] = useState("Claude Sonnet");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reasoningRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!showEditMenu && !showReasoningMenu && !showAddMenu && !showModelMenu) return;
    const handler = (e: MouseEvent) => {
      if (showEditMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) setShowEditMenu(false);
      if (showReasoningMenu && reasoningRef.current && !reasoningRef.current.contains(e.target as Node)) setShowReasoningMenu(false);
      if (showAddMenu && addRef.current && !addRef.current.contains(e.target as Node)) setShowAddMenu(false);
      if (showModelMenu && modelRef.current && !modelRef.current.contains(e.target as Node)) setShowModelMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEditMenu, showReasoningMenu, showAddMenu, showModelMenu]);

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
              onClick={() => setShowSettings(true)}
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
              <div className="relative" ref={reasoningRef}>
                {showReasoningMenu && (
                  <div className="absolute bottom-10 left-0 bg-surface border border-border rounded-lg shadow-lg py-1.5 min-w-[140px] z-20">
                    {(["none", "low", "medium", "high"] as const).map((level) => (
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
                <button
                  onClick={() => setShowReasoningMenu((v) => !v)}
                  className="flex items-center justify-center w-9 h-9 rounded-md cursor-pointer text-text-muted hover:text-text hover:bg-header"
                  title="Reasoning level"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 2.8-1.6 5-4 6.3V17a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.7C6.6 14 5 11.8 5 9a7 7 0 0 1 7-7z" />
                    <path d="M9 21h6M10 17v4M14 17v4" />
                  </svg>
                </button>
              </div>

              {/* Model selector */}
              <div className="relative" ref={modelRef}>
                {showModelMenu && (
                  <div className="absolute bottom-10 left-0 bg-surface border border-border rounded-lg shadow-lg py-1.5 min-w-[180px] z-20">
                    {["Claude Opus", "Claude Sonnet", "Claude Haiku", "GPT-4o", "GPT-4o Mini"].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setModel(m); setShowModelMenu(false); }}
                        className={`w-full text-left px-4 py-2 text-[13px] cursor-pointer hover:bg-header flex items-center gap-2 ${
                          model === m ? "text-text font-medium" : "text-text-muted"
                        }`}
                      >
                        {model === m && <span className="text-blue-500">&#10003;</span>}
                        <span className={model === m ? "" : "ml-5"}>{m}</span>
                      </button>
                    ))}
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
                  <span>{model}</span>
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
                    <path d="M16 18l2-2-8-8-4 1 1-4 8 8 2-2" />
                    <path d="M7 7L2 2M17 3l4 4" />
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
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowSettings(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-surface border border-border rounded-2xl shadow-xl w-[620px] max-h-[700px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-2">
              <h2 className="text-[18px] font-semibold text-text">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="flex items-center justify-center w-9 h-9 rounded-md cursor-pointer text-text-muted hover:text-text hover:bg-header"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 pb-8 flex flex-col gap-7">
              {/* Providers */}
              <div className="flex flex-col gap-5">
                <h3 className="text-[14px] font-semibold text-text border-b border-border pb-2">Providers</h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-text">Anthropic (Claude)</label>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    className="px-3.5 py-2.5 text-[14px] bg-bg border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                  />
                  <span className="text-[11px] text-text-muted">Claude Opus, Sonnet, Haiku</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-text">OpenAI</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="px-3.5 py-2.5 text-[14px] bg-bg border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                  />
                  <span className="text-[11px] text-text-muted">GPT-4o, GPT-4o Mini</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-text">DeepInfra</label>
                  <input
                    type="password"
                    placeholder="di-..."
                    className="px-3.5 py-2.5 text-[14px] bg-bg border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                  />
                  <span className="text-[11px] text-text-muted">Llama, Mixtral, and other open models</span>
                </div>
              </div>

              {/* General */}
              <div className="flex flex-col gap-5">
                <h3 className="text-[14px] font-semibold text-text border-b border-border pb-2">General</h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-text">Default Model</label>
                  <select className="px-3.5 py-2.5 text-[14px] bg-bg border border-border rounded-lg outline-none focus:border-blue-400 text-text">
                    <optgroup label="Anthropic">
                      <option>Claude Opus</option>
                      <option>Claude Sonnet</option>
                      <option>Claude Haiku</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option>GPT-4o</option>
                      <option>GPT-4o Mini</option>
                    </optgroup>
                    <optgroup label="DeepInfra">
                      <option>Llama 3.1 405B</option>
                      <option>Mixtral 8x22B</option>
                    </optgroup>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-text">Max Tokens</label>
                  <input
                    type="number"
                    defaultValue={4096}
                    className="px-3.5 py-2.5 text-[14px] bg-bg border border-border rounded-lg outline-none focus:border-blue-400 text-text"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
