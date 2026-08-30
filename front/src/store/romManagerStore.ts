import { create } from "zustand";
import type { ROMEntry } from "@/types";

export interface Operation {
  id: string;
  type: "to-cia" | "to-cci" | "decrypt" | "compress" | "decompress";
  file: string;
  status: "pending" | "running" | "done" | "error";
  message?: string;
}

interface ROMManagerStore {
  currentDir: string;
  files: ROMEntry[];
  selected: Set<number>;
  operations: Operation[];
  z3dsLevel: number;
  deleteSource: boolean;
  loading: boolean;
  setCurrentDir: (dir: string) => void;
  setFiles: (files: ROMEntry[]) => void;
  toggleSelect: (idx: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addOperation: (op: Operation) => void;
  updateOperation: (id: string, patch: Partial<Operation>) => void;
  clearOperations: () => void;
  setZ3dsLevel: (lvl: number) => void;
  setDeleteSource: (v: boolean) => void;
  setLoading: (v: boolean) => void;
}

export const useROMStore = create<ROMManagerStore>((set) => ({
  currentDir: "",
  files: [],
  selected: new Set(),
  operations: [],
  z3dsLevel: 3,
  deleteSource: false,
  loading: false,
  setCurrentDir: (dir) => set({ currentDir: dir }),
  setFiles: (files) => set({ files }),
  toggleSelect: (idx) => set((s) => {
    const next = new Set(s.selected);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return { selected: next };
  }),
  selectAll: () => set((s) => ({ selected: new Set(s.files.map((_, i) => i)) })),
  clearSelection: () => set({ selected: new Set() }),
  addOperation: (op) => set((s) => ({ operations: [...s.operations, op] })),
  updateOperation: (id, patch) => set((s) => ({
    operations: s.operations.map((o) => o.id === id ? { ...o, ...patch } : o),
  })),
  clearOperations: () => set({ operations: [] }),
  setZ3dsLevel: (lvl) => set({ z3dsLevel: lvl }),
  setDeleteSource: (v) => set({ deleteSource: v }),
  setLoading: (v) => set({ loading: v }),
}));
