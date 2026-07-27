import { crc16 } from "./crc16";

export const NTR = 0;
export const TWL = 1;

export function getHexNumber(byteArray: number[]): number {
  return parseInt("0x" + getHexString(byteArray));
}

export function getCRCFlippedPairBytes(value: number): number[] {
  let bytes = getByteArrayFromNumber(value);
  bytes = reverseArray(bytes);
  return bytes.slice(0, 2);
}

export function getCRC16(bytes: number[]): number {
  return crc16(bytes);
}

export function arrayCopy(
  src: number[],
  srcIndex: number,
  dest: number[],
  destIndex: number,
  length: number
): void {
  dest.splice(destIndex, length, ...src.slice(srcIndex, srcIndex + length));
}

export function hex2bin(hex: string): string {
  return parseInt(hex, 16).toString(2).padStart(8, "0");
}

export async function getBytesFromFile(
  file: Blob,
  start?: number,
  end?: number
): Promise<number[]> {
  if (start === undefined && end === undefined) {
    start = 0;
    end = file.size;
  }
  const blob = file.slice(start, end);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const array = new Uint8Array(reader.result as ArrayBuffer);
      resolve(Array.from(array));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Télécharge une URL (absolue ou relative) en tableau d'octets.
 * Les URLs relatives passent par le proxy Vite (dev) ou Nginx (prod).
 */
export async function downloadUrlAsByteArray(url: string): Promise<number[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return Array.from(new Uint8Array(buffer));
}

export function getWordFromHexTwoBytes(bytes: number[]): string {
  let result = "";
  try {
    for (let i = 0; i < bytes.length; i += 2) {
      const newHex = getHexString([bytes[i + 1]]) + getHexString([bytes[i]]);
      result += String.fromCharCode(parseInt("0x" + newHex));
    }
  } catch (err) {
    console.error("error word", err);
  }
  return result;
}

export function hexToRgbA(hex: string): [number, number, number] {
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    let c = hex.substring(1).split("");
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const val = parseInt("0x" + c.join(""));
    return [(val >> 16) & 255, (val >> 8) & 255, val & 255];
  }
  throw new Error("Bad Hex: " + hex);
}

export function getBytesFromWord(s: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(s));
}

export function getWordFromHexOneByte(bytes: number[]): string {
  let result = "";
  try {
    for (let i = 0; i < bytes.length; i++) {
      const newHex = getHexString([bytes[i]]);
      result += String.fromCharCode(parseInt("0x" + newHex));
    }
  } catch (err) {
    console.error("error word", err);
  }
  return result;
}

export function reverseArray(original: number[]): number[] {
  const reversed: number[] = [];
  for (let i = original.length - 1; i >= 0; i--) {
    reversed.push(original[i]);
  }
  return reversed;
}

export function getByteArrayFromNumber(number: number): number[] {
  const hexString = getHexStringFromNumber(Math.floor(number));
  const byteArray: number[] = [];
  for (let i = 0; i < hexString.length; i += 2) {
    const pair = hexString[i] + hexString[i + 1];
    byteArray.push(parseInt("0x" + pair));
  }
  return byteArray;
}

export function getHexStringFromNumber(number: number): string {
  let hexString = number.toString(16);
  while (hexString.length % 2 !== 0) {
    hexString = "0" + hexString;
  }
  return hexString;
}

export function getHexString(byteArray: number[]): string {
  return Array.from(byteArray, (byte) =>
    ("0" + (byte & 0xff).toString(16)).slice(-2)
  ).join("");
}
