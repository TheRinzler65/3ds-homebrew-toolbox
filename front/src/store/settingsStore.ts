import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings } from "@/types";

interface SettingsStore extends AppSettings {
  setSelectedTarget: (target: string | null) => void;
  setAutoRandomTid: (val: boolean) => void;
  setKeepNds: (val: boolean) => void;
  setSetRomPath: (val: boolean) => void;
  setFolderForGames: (val: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      selectedTarget: null,
      autoRandomTid: false,
      keepNds: false,
      setRomPath: false,
      folderForGames: "Games/NDS",

      setSelectedTarget: (target) => set({ selectedTarget: target }),
      setAutoRandomTid: (val) => set({ autoRandomTid: val }),
      setKeepNds: (val) => set({ keepNds: val }),
      setSetRomPath: (val) => set({ setRomPath: val }),
      setFolderForGames: (val) => set({ folderForGames: val }),
    }),
    { name: "multitools-settings" }
  )
);

// Non-reactive getter for use inside NDSFile class
export function getSettings(): AppSettings {
  return useSettingsStore.getState();
}
