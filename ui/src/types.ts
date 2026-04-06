export interface FileNode {
  id: string;
  name: string;
  isDir: boolean;
}

export interface TabData {
  id: string;
  name: string;
  content: string;
  dirty: boolean;
}
