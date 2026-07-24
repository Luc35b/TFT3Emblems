import { OCRService } from "../Core/OCRService";
import { GameEventManager, GameEventType } from "../GameState/GameEvents";
import { NumericCropRegion, NumericOcrDetector } from "./NumericOcrDetector";

export const DEFAULT_HP_CROP: NumericCropRegion = {
  x: 0.86, y: 0.84, width: 0.12, height: 0.10,
};

export class HPDetector {
  private readonly detector: NumericOcrDetector;

  constructor(ocr = new OCRService(), events = new GameEventManager(), region = DEFAULT_HP_CROP) {
    this.detector = new NumericOcrDetector(ocr, events, {
      region, min: 0, max: 100,
      confidenceThreshold: 0.78,
      eventType: GameEventType.HP_CHANGED,
      valueName: "hp",
    });
  }

  detect(frame: ImageData): Promise<number | null> {
    return this.detector.detect(frame);
  }
}
