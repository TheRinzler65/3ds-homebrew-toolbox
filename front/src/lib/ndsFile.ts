import * as HexUtils from "./hexUtils";
import { NTR, TWL } from "./hexUtils";
import type { ForwarderCard, NDSFileData } from "@/types";
import { getSettings } from "@/store/settingsStore";
import { getRandomTid } from "./miscUtils";
import { crc16 } from "./crc16";

export class NDSFile {
  file: File | null;
  finalFileName: string;
  name: string;
  publisher: string = "";
  tid: string = "";
  overrideTid: string = "";
  gameTitle: string = "";
  gamePath: string = "";
  cardMode: number = NTR;
  canvasObject?: HTMLCanvasElement;

  private killed = false;
  private iconData: number[][] | null = null;
  private colores: string[] | null = null;
  private updatesCallback: (data: NDSFileData) => void;

  constructor(file: File, updatesCallback: (data: NDSFileData) => void) {
    this.file = file;
    this.finalFileName = file.name;
    this.name = file.name;
    this.updatesCallback = updatesCallback;

    this.loadGamePath(file.name);

    this.getCardMode().then((cardMode) => {
      this.cardMode = cardMode;
    });

    const settings = getSettings();
    if (settings.autoRandomTid) {
      this.overrideTid = getRandomTid();
    }

    this.getTIDString().then((tidString) => {
      this.tid = tidString;
      if (!this.overrideTid) {
        this.overrideTid = this.tid;
      }
      this.notifyChanges();
    });

    this.getEnglishNameLocation().then((res) => {
      this.getBytesFromFile(res, res + 0x100).then((gameTitleBytes) => {
        const string = HexUtils.getWordFromHexTwoBytes(gameTitleBytes);
        const gameTitleArray = string.split("\n");
        const publisher = gameTitleArray[gameTitleArray.length - 1];
        gameTitleArray.splice(gameTitleArray.length - 1, 1);
        const gameTitle = gameTitleArray.join(" ");
        this.name = gameTitle.trim().replace(/\u0000/g, "");
        this.publisher = publisher.trim().replace(/\u0000/g, "");
        this.notifyChanges();
      });
    });

    this.getFullGameTitleString().then((gameTitle) => {
      this.gameTitle = gameTitle;
      this.notifyChanges();
    });

    this.createCanvas();
  }

  loadGamePath(fileName: string) {
    const settings = getSettings();
    let gameFolder = settings.folderForGames || "Games/NDS";
    if (gameFolder.endsWith("/")) {
      gameFolder = gameFolder.substring(0, gameFolder.length - 1);
    }
    this.gamePath = gameFolder + "/" + fileName;
  }

  reloadTid() {
    this.overrideTid = getRandomTid();
    this.notifyChanges();
  }

  kill() {
    this.killed = true;
    this.file = null;
  }

  notifyChanges() {
    if (this.killed) return;
    this.updatesCallback({
      name: this.name,
      publisher: this.publisher,
      tid: this.tid,
      overrideTid: this.overrideTid,
      gameTitle: this.gameTitle,
      gamePath: this.gamePath,
      canvasObject: this.canvasObject,
    });
  }

  async getBytesFromFile(start: number, end: number): Promise<number[]> {
    if (!this.file) return [];
    return HexUtils.getBytesFromFile(this.file, start, end);
  }

  async getTID(): Promise<number[]> {
    return this.getBytesFromFile(0x0c, 0x10);
  }

  async getTIDString(): Promise<string> {
    const tid = await this.getTID();
    return HexUtils.getWordFromHexOneByte(tid);
  }

  async getFullGameTitleString(): Promise<string> {
    const bytes = await this.getFullGameTitleBytes();
    return HexUtils.getWordFromHexOneByte(bytes).trim().replace(/\u0000/g, "");
  }

  async getFullGameTitleBytes(): Promise<number[]> {
    return this.getBytesFromFile(0x0, 0x0c);
  }

  async getBannerLocation(): Promise<number> {
    const result = await this.getBytesFromFile(0x68, 0x68 + 0x04);
    return HexUtils.getHexNumber(HexUtils.reverseArray(result));
  }

  async getEnglishNameLocation(): Promise<number> {
    const bannerLocation = await this.getBannerLocation();
    return bannerLocation + 0x340;
  }

  async getIconDataLocation(): Promise<number> {
    const bannerLocation = await this.getBannerLocation();
    return bannerLocation + 0x20;
  }

  async getPalleteLocation(): Promise<number> {
    const bannerLocation = await this.getBannerLocation();
    return bannerLocation + 0x220;
  }

  async getCardMode(): Promise<number> {
    const arr = await this.getBytesFromFile(0x12, 0x13);
    const b = arr[0];
    if (b === 0) return NTR;
    if (b === 2 || b === 3) return TWL;
    return 0;
  }

  async getEnglishNameData(): Promise<{ bytes: number[]; location: number }> {
    const location = await this.getEnglishNameLocation();
    const bytes = await this.getBytesFromFile(location, location + 0x100);
    return { bytes, location };
  }

  async getIconBytes(): Promise<number[]> {
    const iconLocation = await this.getIconDataLocation();
    return this.getBytesFromFile(iconLocation, iconLocation + 0x200);
  }

  async getPalleteBytes(): Promise<number[]> {
    const location = await this.getPalleteLocation();
    return this.getBytesFromFile(location, location + 0x20);
  }

  async getPaletteColors(): Promise<string[]> {
    if (this.colores) return this.colores;
    const bites = await this.getPalleteBytes();
    this.colores = [];
    for (let i = 0; i < 32; i += 2) {
      const reversed = HexUtils.reverseArray(bites.slice(i, i + 2));
      const normalColor = HexUtils.getHexString(reversed);
      let bits = HexUtils.hex2bin(normalColor);
      while (bits.length < 16) bits = "0" + bits;
      const r = parseInt(bits.substring(11, 16), 2);
      const g = parseInt(bits.substring(6, 11), 2);
      const b = parseInt(bits.substring(1, 6), 2);
      const R = Math.round((r * 255) / 31);
      const G = Math.round((g * 255) / 31);
      const B = Math.round((b * 255) / 31);
      const color =
        HexUtils.getHexString([R]) +
        HexUtils.getHexString([G]) +
        HexUtils.getHexString([B]);
      this.colores.push("#" + color);
    }
    return this.colores;
  }

  getPosJ(tile: number, i: number): number {
    let posJ = Math.floor(i / 8);
    if (tile < 4) posJ += 0;
    else if (tile < 8) posJ += 8;
    else if (tile < 12) posJ += 16;
    else posJ += 24;
    return posJ;
  }

  async getIconData(): Promise<number[][]> {
    if (this.iconData) return this.iconData;
    const bytes = await this.getIconBytes();

    this.iconData = [];
    for (let z = 0; z < 32; z++) {
      const row: number[] = [];
      for (let k = 0; k < 32; k++) row.push(0x0);
      this.iconData.push(row);
    }

    let counter = 0;
    let vCounter = 0;
    const v: number[] = new Array(1024).fill(0);

    for (let j = 0; j < 16; j++) {
      for (let i = 0; i < 32; i++) {
        let val = bytes[counter] || 0;
        if (val < 0) val = val & 0xff;
        let bits = val.toString(2);
        while (bits.length < 8) bits = "0" + bits;
        const val1 = parseInt(bits.substring(0, 4), 2);
        const val2 = parseInt(bits.substring(4, 8), 2);
        v[vCounter] = val2;
        v[vCounter + 1] = val1;
        vCounter += 2;
        counter++;
      }
    }

    let contador = 0;
    for (let tile = 0; tile < 16; tile++) {
      for (let i = 0; i < 64; i++) {
        const posI = (i % 8) + ((tile % 4) * 8);
        const posJ = this.getPosJ(tile, i);
        if (posI < 32 && posJ < 32) {
          this.iconData[posI][posJ] = v[contador];
        }
        contador++;
      }
    }

    return this.iconData;
  }

  async createCanvas(): Promise<void> {
    try {
      const [iconData, paletteColors] = await Promise.all([
        this.getIconData(),
        this.getPaletteColors(),
      ]);

      const canvas = document.createElement("canvas");
      canvas.style.width = "48px";
      canvas.style.height = "48px";
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

      for (let i = 0; i < 32; i++) {
        for (let j = 0; j < 32; j++) {
          const pixel = ctx.getImageData(i, j, 1, 1);
          const dataPixel = pixel.data;
          const idx = iconData[i]?.[j];
          if (!idx || idx === 0) {
            dataPixel[0] = 255;
            dataPixel[1] = 255;
            dataPixel[2] = 255;
            dataPixel[3] = 0;
          } else {
            const rgbaData = HexUtils.hexToRgbA(paletteColors[idx] || "#000000");
            dataPixel[0] = rgbaData[0];
            dataPixel[1] = rgbaData[1];
            dataPixel[2] = rgbaData[2];
            dataPixel[3] = 255;
          }
          ctx.putImageData(pixel, i, j);
        }
      }

      this.canvasObject = canvas;
      this.notifyChanges();
    } catch (err) {
      console.error("Error creating canvas:", err);
    }
  }

  async getBannerIconBytes(): Promise<number[]> {
    const location = await this.getBannerLocation();
    const mode = this.cardMode;
    if (mode === NTR) {
      return this.getBytesFromFile(location, location + 0x840);
    } else if (mode === TWL) {
      return this.getBytesFromFile(location, location + 0x23c0);
    }
    return [];
  }

  private async getBannerSize(): Promise<number> {
    const data = await this.getBannerIconBytes();
    return data.length;
  }

  private setBytesAt(template: number[], pos: number, data: number[]): void {
    for (let i = 0; i < data.length; i++) {
      if (pos + i < template.length) {
        template[pos + i] = data[i] ?? 0;
      }
    }
  }

  private async getJapaneseNameBytes(): Promise<number[]> {
    const bl = await this.getBannerLocation();
    return this.getBytesFromFile(bl + 0x240, bl + 0x340);
  }

  private async getEnglishNameBytes(): Promise<number[]> {
    const bl = await this.getBannerLocation();
    return this.getBytesFromFile(bl + 0x340, bl + 0x440);
  }

  async writeBanner(templateBytes: number[], card: ForwarderCard): Promise<void> {
    const start = Number(card.banner_location);
    const mode = this.cardMode;

    if (mode === TWL) {
      const banner = await this.getBannerIconBytes();
      if (banner.length >= 0x23c0) {
        for (let i = 0; i < 0x23c0; i++) {
          templateBytes[start + i] = banner[i] ?? 0;
        }
      }
      return;
    }

    // NTR mode: expand 2112-byte banner to 9152-byte format
    const banner = await this.getBannerIconBytes();
    if (banner.length === 0) return;

    // 1. Copy raw banner (2112 bytes) to template
    for (let i = 0; i < banner.length && i < 0x840; i++) {
      templateBytes[start + i] = banner[i] ?? 0;
    }
    // Zero-fill remaining base area
    for (let i = banner.length; i < 0x840; i++) {
      templateBytes[start + i] = 0;
    }

    // 2. Copy Japanese names (256 bytes at banner+0x240) to offset +0x840
    const japName = await this.getJapaneseNameBytes();
    for (let i = 0; i < japName.length && i < 0x100; i++) {
      templateBytes[start + 0x840 + i] = japName[i] ?? 0;
    }

    // 3. Copy English names (256 bytes at banner+0x340) to offset +0x940
    const engName = await this.getEnglishNameBytes();
    for (let i = 0; i < engName.length && i < 0x100; i++) {
      templateBytes[start + 0x940 + i] = engName[i] ?? 0;
    }

    // 4. Write animation header (0x03, 0x01) at start
    templateBytes[start] = 0x03;
    templateBytes[start + 1] = 0x01;

    // 5. Copy icon tile data (32..544) 8 times to animation area (+0x1240)
    const iconTiles: number[] = [];
    for (let i = 0x20; i < 0x220 && i < banner.length; i++) {
      iconTiles.push(banner[i] ?? 0);
    }
    for (let frame = 0; frame < 8; frame++) {
      for (let i = 0; i < iconTiles.length; i++) {
        templateBytes[start + 0x1240 + frame * iconTiles.length + i] = iconTiles[i];
      }
    }

    // 6. Copy palette (544..576) 8 times to palette animation area (+0x2240)
    const palette: number[] = [];
    for (let i = 0x220; i < 0x240 && i < banner.length; i++) {
      palette.push(banner[i] ?? 0);
    }
    for (let frame = 0; frame < 8; frame++) {
      for (let i = 0; i < palette.length; i++) {
        templateBytes[start + 0x2240 + frame * palette.length + i] = palette[i];
      }
    }

    // 7. Write end sequence at +0x2340
    templateBytes[start + 0x2340] = 0x01;
    templateBytes[start + 0x2341] = 0x00;
    templateBytes[start + 0x2342] = 0x00;
    templateBytes[start + 0x2343] = 0x01;

    // 8. Calculate CRC16 checksums
    const getRange = (from: number, to: number): number[] => {
      const result: number[] = [];
      for (let i = from; i <= to; i++) {
        if (start + i < templateBytes.length) {
          result.push(templateBytes[start + i]);
        }
      }
      return result;
    };

    const getFlippedCRC = (data: number[]): number[] => {
      const value = crc16(data);
      const b1 = (value >> 8) & 0xff;
      const b0 = value & 0xff;
      return [b0, b1];
    };

    const crc1 = getFlippedCRC(getRange(0x20, 0x83f));
    const crc2 = getFlippedCRC(getRange(0x20, 0x93f));
    const crc3 = getFlippedCRC(getRange(0x20, 0xa3f));
    const crc4 = getFlippedCRC(getRange(0x1240, 0x23bf));

    templateBytes[start + 2] = crc1[0];
    templateBytes[start + 3] = crc1[1];
    templateBytes[start + 4] = crc2[0];
    templateBytes[start + 5] = crc2[1];
    templateBytes[start + 6] = crc3[0];
    templateBytes[start + 7] = crc3[1];
    templateBytes[start + 8] = crc4[0];
    templateBytes[start + 9] = crc4[1];
  }

  static calculateHeaderCRC16(templateBytes: number[]): void {
    const data = templateBytes.slice(0, 350);
    const crc = crc16(data);
    templateBytes[350] = crc & 0xff;
    templateBytes[351] = (crc >> 8) & 0xff;
  }

  writeGamePath(
    templateBytes: number[],
    offset: number,
    length: number
  ): void {
    const gamePath = HexUtils.getBytesFromWord(this.gamePath);
    let counter = 0;
    let i = offset;
    while (counter < length) {
      templateBytes[i] = gamePath[counter] ?? 0;
      counter++;
      i++;
    }
  }
}
