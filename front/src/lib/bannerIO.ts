import { NDSFile } from "./ndsFile";

export async function exportBanner(ndsFile: NDSFile): Promise<Uint8Array> {
  const banner = await ndsFile.getBannerIconBytes();
  if (!banner || banner.length === 0) {
    throw new Error("No banner data available");
  }

  const mode = ndsFile.cardMode;
  // NTR: 0 = NTR (DS), 1 = TWL (DSi)
  if (mode === 0) {
    // NTR: expand to 9152-byte format for export
    const result = new Uint8Array(9152);
    for (let i = 0; i < banner.length && i < 2112; i++) {
      result[i] = banner[i];
    }

    const bl = await ndsFile.getBannerLocation();
    const japName = await ndsFile.getBytesFromFile(bl + 0x240, bl + 0x340);
    const engName = await ndsFile.getBytesFromFile(bl + 0x340, bl + 0x440);

    // Copy Japanese and English names to export positions
    for (let i = 0; i < 256; i++) {
      result[2112 + i] = japName[i] ?? 0;
      result[2368 + i] = engName[i] ?? 0;
    }

    result[0] = 0x03;
    result[1] = 0x01;

    // Copy icon tiles 8 times for animation frames
    const iconTiles = banner.slice(32, 544);
    for (let frame = 0; frame < 8; frame++) {
      for (let i = 0; i < iconTiles.length; i++) {
        result[4672 + frame * iconTiles.length + i] = iconTiles[i];
      }
    }

    // Copy palette 8 times
    const palette = banner.slice(544, 576);
    for (let frame = 0; frame < 8; frame++) {
      for (let i = 0; i < palette.length; i++) {
        result[8768 + frame * palette.length + i] = palette[i];
      }
    }

    result[9024] = 0x01;
    result[9025] = 0x00;
    result[9026] = 0x00;
    result[9027] = 0x01;

    return result;
  }

  // TWL: return as-is (9152 bytes)
  return new Uint8Array(banner);
}

export function importBanner(
  ndsFile: NDSFile,
  bannerBytes: Uint8Array
): void {
  // Store as imported banner data
  // The writeBanner method will use this when generating the forwarder
  // For now, ndsFile stores the override banner
  (ndsFile as any)._importedBanner = Array.from(bannerBytes);
}

export function downloadBannerFile(
  bannerData: Uint8Array,
  fileName: string
): void {
  const blob = new Blob([bannerData], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `banner-${fileName.replace(/\.nds$/i, "")}.bin`;
  a.click();
  URL.revokeObjectURL(url);
}
