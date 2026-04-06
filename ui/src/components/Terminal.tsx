import { useState, useCallback, useRef, useEffect } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Command } from "@tauri-apps/plugin-shell";
import "@xterm/xterm/css/xterm.css";

const MIN_HEIGHT = 0;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 200;

interface TerminalProps {
  rootPath: string | null;
}

export default function Terminal({ rootPath }: TerminalProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const termContainerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lineBuffer = useRef("");
  const running = useRef(false);
  const cwd = useRef(rootPath);
  cwd.current = rootPath;

  useEffect(() => {
    if (!termContainerRef.current) return;

    const term = new XTerm({
      fontSize: 13,
      fontFamily: "monospace",
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: "#f8f8f8",
        foreground: "#333",
        cursor: "#333",
        selectionBackground: "#b5d5ff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termContainerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const writePrompt = () => {
      const dir = cwd.current ?? "~";
      const short = dir.split("/").pop() || dir;
      term.write(`\x1b[36m${short}\x1b[0m $ `);
    };

    writePrompt();

    const dataHandler = term.onData(async (data) => {
      if (running.current) return;

      if (data === "\r") {
        term.write("\r\n");
        const cmd = lineBuffer.current.trim();
        lineBuffer.current = "";

        if (cmd === "") {
          writePrompt();
          return;
        }

        if (cmd.startsWith("cd ")) {
          const target = cmd.slice(3).trim();
          if (target.startsWith("/")) {
            cwd.current = target;
          } else {
            cwd.current = `${cwd.current}/${target}`;
          }
          writePrompt();
          return;
        }

        running.current = true;
        try {
          const result = await Command.create("bash", ["-c", cmd], {
            cwd: cwd.current ?? undefined,
            encoding: "utf-8",
          }).execute();

          if (result.stdout) term.write(result.stdout.replace(/\n/g, "\r\n"));
          if (result.stderr) term.write(`\x1b[31m${result.stderr.replace(/\n/g, "\r\n")}\x1b[0m`);
        } catch (e) {
          term.write(`\x1b[31mError: ${e}\x1b[0m\r\n`);
        }
        running.current = false;
        writePrompt();
      } else if (data === "\x7f") {
        if (lineBuffer.current.length > 0) {
          lineBuffer.current = lineBuffer.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (data >= " ") {
        lineBuffer.current += data;
        term.write(data);
      }
    });

    return () => {
      dataHandler.dispose();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    const el = termContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const parentBottom = containerRef.current.parentElement!.getBoundingClientRect().bottom;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, parentBottom - e.clientY)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div ref={containerRef} className="flex-shrink-0 flex flex-col bg-bg" style={{ height }}>
      <div
        onMouseDown={onMouseDown}
        className="h-1 flex-shrink-0 cursor-row-resize hover:bg-blue-400 active:bg-blue-400 z-10"
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="h-8 min-h-8 px-4 text-[11px] font-semibold tracking-wide text-text-muted flex items-center border-b border-border bg-header">
          TERMINAL
        </div>
        <div ref={termContainerRef} className="flex-1 min-h-0 p-1" />
      </div>
    </div>
  );
}
