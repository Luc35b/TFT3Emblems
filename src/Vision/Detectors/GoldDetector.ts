import { OCRService } from "../Core/OCRService";
import { GameEventManager, GameEventType } from "../GameState/GameEvents";
import { NumericCropRegion, NumericOcrDetector } from "./NumericOcrDetector";

export const DEFAULT_GOLD_CROP: NumericCropRegion = {
  x: 0.44, y: 0.88, width: 0.12, height: 0.08,
};

export class GoldDetector {
  private readonly detector: NumericOcrDetector;

  constructor(ocr = new OCRService(), events = new GameEventManager(), region = DEFAULT_GOLD_CROP) {
    this.detector = new NumericOcrDetector(ocr, events, {
      region, min: 0, max: 999,
      confidenceThreshold: 0.72,
      eventType: GameEventType.GOLD_CHANGED,
      valueName: "gold",
    });
  }

  detect(frame: ImageData): Promise<number | null> {
    return this.detector.detect(frame);
  }
}
