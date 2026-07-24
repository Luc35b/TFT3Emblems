import { OCRService } from "../Core/OCRService";
import { GameEventManager, GameEventType } from "../GameState/GameEvents";

export interface NumericCropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NumericDetectorOptions {
  region: NumericCropRegion;
  min: number;
  max: number;
  confidenceThreshold: number;
  eventType: GameEventType;
  valueName: string;
}

export class NumericOcrDetector {
  private readonly ocr: OCRService;
  private readonly events: GameEventManager;
  private readonly options: NumericDetectorOptions;
  private lastCropHash: number | null = null;
  private lastValue: number | null = null;

  constructor(
    ocr: OCRService,
    events: GameEventManager,
    options: NumericDetectorOptions,
  ) {
    this.ocr = ocr;
    this.events = events;
    this.options = options;
    this.validateRegion(options.region);
  }

  async detect(frame: ImageData): Promise<number | null> {
    const crop = cropImage(frame, this.options.region);
    const cropHash = hashImage(crop);
    if (cropHash === this.lastCropHash) return this.lastValue;
    this.lastCropHash = cropHash;

    const result = await this.ocr.recognizeTextWithConfidence(crop);
    if (result.confidence < this.options.confidenceThreshold) return this.lastValue;

    const value = parseNumericValue(result.text, this.options.min, this.options.max);
    if (value === null) return this.lastValue;

    if (value !== this.lastValue) {
      const previousValue = this.lastValue;
      this.lastValue = value;
      this.events.emitEvent(this.options.eventType, {
        [this.options.valueName]: value,
        previousValue,
        confidence: result.confidence,
      });
    }

    return this.lastValue;
  }

  getLastValue(): number | null {
    return this.lastValue;
  }

  private validateRegion(region: NumericCropRegion): void {
    if (
      region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0 ||
      region.x + region.width > 1 || region.y + region.height > 1
    ) {
      throw new Error("Numeric detector crop region must fit within normalized frame bounds.");
    }
  }
}

export function cropImage(frame: ImageData, region: NumericCropRegion): ImageData {
  const x = Math.floor(frame.width * region.x);
  const y = Math.floor(frame.height * region.y);
  const width = Math.max(1, Math.min(frame.width - x, Math.floor(frame.width * region.width)));
  const height = Math.max(1, Math.min(frame.height - y, Math.floor(frame.height * region.height)));
  const data = new Uint8ClampedArray(width * height * 4);

  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((y + row) * frame.width + x) * 4;
    data.set(frame.data.subarray(sourceStart, sourceStart + width * 4), row * width * 4);
  }
  return new ImageData(data, width, height);
}

export function parseNumericValue(rawText: string, min: number, max: number): number | null {
  const normalized = rawText
    .toUpperCase()
    .replace(/[OQD]/g, "0")
    .replace(/[IL|]/g, "1")
    .replace(/S/g, "5")
    .replace(/B/g, "8")
    .replace(/G/g, "6");
  const tokens = normalized.match(/\d{1,3}/g);
  if (!tokens || tokens.length !== 1) return null;

  const value = Number(tokens[0]);
  return value >= min && value <= max ? value : null;
}

function hashImage(image: ImageData): number {
  let hash = 2166136261;
  for (const value of image.data) {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
