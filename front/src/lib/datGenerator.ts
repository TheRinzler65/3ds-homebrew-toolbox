import * as HexUtils from "./hexUtils";

// Minimal abpathsetter.nds template for DAT generation
// This is a small NDS binary that R4/DSTT cards use for path redirection
// In production, this should be fetched from CDN or bundled
const ABPATHSETTER_BASE64 = "EAAAFgAAABIAAABEAAQAAAAAABIAAABkAAAAAAASAAAAAgAAAAAAEgAAAJQAAAAAAAAAEAAAABwAAAABAAAAEAAAABQAAAABAAAAcGF0aC5uZHMAMDAwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABwAAAABAAAAEAAAABQAAAABAAAAcGF0aC5uZHMAMDAwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABwAAAABAAAAEAAAABQAAAABAAAAcGF0aC5uZHMAMDAwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABwAAAABAAAAEAAAABQAAAABAAAAcGF0aC5uZHMAMDAwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABwAAAABAAAAEAAAABQAAAABAAAAcGF0aC5uZHMAMDAwMAAAAAAAAAAAAAAAAAAAAA==";

function base64ToBytes(b64: string): number[] {
  const binaryStr = atob(b64);
  const bytes = new Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

let cachedTemplate: number[] | null = null;

function getTemplate(): number[] {
  if (!cachedTemplate) {
    cachedTemplate = base64ToBytes(ABPATHSETTER_BASE64);
  }
  return [...cachedTemplate];
}

export function generateDAT(
  gamePath: string,
  gamePathOffset: number,
  gamePathLength: number
): Uint8Array {
  const template = getTemplate();
  const pathBytes = HexUtils.getBytesFromWord(gamePath);

  let counter = 0;
  let i = gamePathOffset;
  while (counter < gamePathLength) {
    template[i] = pathBytes[counter] ?? 0;
    counter++;
    i++;
  }

  return new Uint8Array(template);
}

export async function fetchDATTemplate(): Promise<number[]> {
  try {
    const response = await fetch("/api/templates/abpathsetter.nds");
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      cachedTemplate = bytes;
      return bytes;
    }
  } catch {
    // Fallback to bundled
  }
  return getTemplate();
}
