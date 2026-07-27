import { TID_LIST } from "./tidList";

export function getRandomTid(): string {
  const random = Math.floor(Math.random() * TID_LIST.length);
  return TID_LIST[random];
}

export function convertCardFileToJSON(
  string: string
): Record<string, string | boolean> {
  const json: Record<string, string | boolean> = {};
  const split =
    string.indexOf("\r\n") > -1 ? string.split("\r\n") : string.split("\n");

  for (let i = 0; i < split.length; i++) {
    const line = split[i];
    if (!line || line.split("=")[0] === "") continue;
    const key = line.split("=")[0];
    const val = line.split("=")[1];
    if (val === "false") json[key] = false;
    else if (val === "true") json[key] = true;
    else json[key] = val;
  }
  return json;
}

/**
 * Télécharge un fichier texte (URL absolue ou relative).
 * Les URLs relatives passent par le proxy Vite (dev) ou Nginx (prod).
 */
export async function requestTextFile(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}
