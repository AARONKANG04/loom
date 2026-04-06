import { Command, type Child } from "@tauri-apps/plugin-shell";

let backendChild: Child | null = null;
let backendPort: number | null = null;

export function getBackendPort(): number | null {
  return backendPort;
}

export function getBackendUrl(): string | null {
  return backendPort ? `http://127.0.0.1:${backendPort}` : null;
}

async function findFreePort(): Promise<number> {
  const output = await Command.create("bash", [
    "-c",
    "python3 -c \"import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()\"",
  ]).execute();
  const port = parseInt(output.stdout.trim(), 10);
  if (isNaN(port)) throw new Error("Could not find a free port");
  return port;
}

export async function startBackend(backendDir: string): Promise<void> {
  const port = await findFreePort();
  backendPort = port;
  const healthUrl = `http://127.0.0.1:${port}/health`;

  const cmd = Command.create("bash", [
    "-c",
    `cd "${backendDir}" && uv run python run.py --port ${port}`,
  ]);

  cmd.stdout.on("data", (line) => console.log("[backend]", line));
  cmd.stderr.on("data", (line) => console.warn("[backend]", line));

  backendChild = await cmd.spawn();

  // Poll until healthy
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(healthUrl);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Backend failed to start within 15s");
}

export async function stopBackend(): Promise<void> {
  await backendChild?.kill();
  backendChild = null;
  backendPort = null;
}
