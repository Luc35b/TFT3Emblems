import { OCRService } from "../Core/OCRService";
import { GameEventManager, GameEventType } from "../GameState/GameEvents";

/** Normalized coordinates: values are fractions of the full TFT frame. */
export interface StageCropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StageChangedEventData {
  stage: string;
  previousStage: string | null;
}

export const DEFAULT_STAGE_CROP: StageCropRegion = {
  // TFT's stage indicator is centered near the top edge of the game view.
  x: 0.4,
  y: 0.01,
  width: 0.2,
  height: 0.08,
};

export class StageDetector {
  private readonly ocr: OCRService;
  private readonly events: GameEventManager;
  private readonly cropRegion: StageCropRegion;
  private lastCropHash: number | null = null;
  private lastStage: string | null = null;

  constructor(
    ocr: OCRService = new OCRService(),
    events: GameEventManager = new GameEventManager(),
    cropRegion: StageCropRegion = DEFAULT_STAGE_CROP,
  ) {
    this.ocr = ocr;
    this.events = events;
    this.cropRegion = StageDetector.validateCropRegion(cropRegion);
  }

  /**
   * OCRs only the configured top-center crop. Identical crops use the cached
   * result and do not invoke OCR again.
   */
  async detect(frame: ImageData): Promise<string | null> {
    const crop = this.cropFrame(frame);
    const cropHash = StageDetector.hashImage(crop);

    if (cropHash === this.lastCropHash) {
      return this.lastStage;
    }

    this.lastCropHash = cropHash;
    const ocrResult = await this.ocr.recognizeTextWithConfidence(crop);
    if (ocrResult.confidence < 0.72) return this.lastStage;
    const stage = StageDetector.normalizeStage(ocrResult.text);
    if (!stage) {
      return this.lastStage;
    }

    if (stage !== this.lastStage) {
      const previousStage = this.lastStage;
      this.lastStage = stage;
      this.events.emitEvent(GameEventType.STAGE_CHANGED, {
        stage,
        previousStage,
      } satisfies StageChangedEventData);
    }

    return this.lastStage;
  }

  getLastStage(): string | null {
    return this.lastStage;
  }

  getCropRegion(): StageCropRegion {
    return { ...this.cropRegion };
  }

  private cropFrame(frame: ImageData): ImageData {
    const x = Math.floor(frame.width * this.cropRegion.x);
    const y = Math.floor(frame.height * this.cropRegion.y);
    const width = Math.max(1, Math.min(frame.width - x, Math.floor(frame.width * this.cropRegion.width)));
    const height = Math.max(1, Math.min(frame.height - y, Math.floor(frame.height * this.cropRegion.height)));
    const data = new Uint8ClampedArray(width * height * 4);

    for (let row = 0; row < height; row += 1) {
      const sourceStart = ((y + row) * frame.width + x) * 4;
      const targetStart = row * width * 4;
      data.set(frame.data.subarray(sourceStart, sourceStart + width * 4), targetStart);
    }

    return new ImageData(data, width, height);
  }

  private static normalizeStage(rawText: string): string | null {
    const normalized = rawText
      .toUpperCase()
      .replace(/[—–_:./\\]/g, "-")
      .replace(/[OQD]/g, "0")
      .replace(/[IL|]/g, "1")
      .replace(/\s+/g, "")
      .replace(/[^0-9-]/g, "");
    const match = normalized.match(/^(\d{1,2})-(\d)$/);
    if (!match) return null;

    const round = Number(match[1]);
    const stage = Number(match[2]);
    // Reject OCR noise while allowing all normal TFT rounds.
    if (round < 1 || round > 8 || stage < 1 || stage > 7) return null;
    return `${round}-${stage}`;
  }

  private static validateCropRegion(region: StageCropRegion): StageCropRegion {
    if (
      region.x < 0 || region.y < 0 ||
      region.width <= 0 || region.height <= 0 ||
      region.x + region.width > 1 || region.y + region.height > 1
    ) {
      throw new Error("Stage crop region must fit within normalized frame bounds.");
    }
    return { ...region };
  }

  private static hashImage(image: ImageData): number {
    let hash = 2166136261;
    for (const value of image.data) {
      hash ^= value;
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
}
