export interface ForwarderCard {
  id: string;
  name?: string;
  banner_location?: string;
  gamepath_location?: string;
  gamepath_length?: string;
  [key: string]: string | boolean | undefined;
}

export interface NDSFileData {
  name: string;
  publisher: string;
  tid: string;
  overrideTid: string;
  gameTitle: string;
  gamePath: string;
  canvasObject?: HTMLCanvasElement;
}

export interface NDSEntry {
  id: string;
  file: File;
  data: Partial<NDSFileData>;
  ndsFile?: import("@/lib/ndsFile").NDSFile;
}

export interface AppSettings {
  selectedTarget: string | null;
  autoRandomTid: boolean;
  keepNds: boolean;
  setRomPath: boolean;
  folderForGames: string;
}

export interface ROMEntry {
  name: string;
  size: number;
  mtime: number;
}

export interface ROMFileEntry {
  name: string;
  size: number;
  mtime: number;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: string;
  badge?: string;
}
