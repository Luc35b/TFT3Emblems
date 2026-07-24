import { OCRService } from "../Core/OCRService";
import { GameEventManager, GameEventType } from "../GameState/GameEvents";
import { NumericCropRegion, NumericOcrDetector } from "./NumericOcrDetector";

export const DEFAULT_LEVEL_CROP: NumericCropRegion = {
  x: 0.04, y: 0.84, width: 0.10, height: 0.10,
};

export class LevelDetector {
  private readonly detector: NumericOcrDetector;

  constructor(ocr = new OCRService(), events = new GameEventManager(), region = DEFAULT_LEVEL_CROP) {
    this.detector = new NumericOcrDetector(ocr, events, {
      region, min: 1, max: 12,
      confidenceThreshold: 0.85,
      eventType: GameEventType.LEVEL_CHANGED,
      valueName: "level",
    });
  }

  detect(frame: ImageData): Promise<number | null> {
    return this.detector.detect(frame);
  }
}
