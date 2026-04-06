import { load, type Store } from "@tauri-apps/plugin-store";

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await load("settings.json", { defaults: {}, autoSave: true });
  }
  return store;
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const s = await getStore();
  const val = await s.get<T>(key);
  return val ?? null;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const s = await getStore();
  await s.set(key, value);
}
