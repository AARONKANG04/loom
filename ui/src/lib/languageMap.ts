const EXT_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".json": "json",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".less": "less",
  ".md": "markdown",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".cs": "csharp",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".kt": "kotlin",
  ".sql": "sql",
  ".sh": "shell",
  ".bash": "shell",
  ".zsh": "shell",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "plaintext",
  ".xml": "xml",
  ".svg": "xml",
  ".graphql": "graphql",
  ".dockerfile": "dockerfile",
};

export function getLanguageFromPath(path: string): string {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return "plaintext";
  const ext = path.slice(dot).toLowerCase();
  return EXT_TO_LANGUAGE[ext] ?? "plaintext";
}
