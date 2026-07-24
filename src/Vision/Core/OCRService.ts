import { createWorker, PSM } from "tesseract.js";

export interface OCRResult {
  text: string;
  confidence: number;
}

export class OCRService {
  private workerPromise: ReturnType<typeof createWorker> | null = null;

  private async getWorker() {
    if (!this.workerPromise) {
      this.workerPromise = createWorker("eng", 1);
    }
    const worker = await this.workerPromise;
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789-:/ ",
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
    });
    return worker;
  }

  recognizeText(_image: ImageData): string {
    // Recognize text from image
    return "";
  }

  async recognizeTextWithConfidence(image: ImageData): Promise<OCRResult> {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d")?.putImageData(image, 0, 0);

    const worker = await this.getWorker();
    const result = await worker.recognize(canvas);
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100,
    };
  }

  async terminate(): Promise<void> {
    if (!this.workerPromise) return;
    const worker = await this.workerPromise;
    await worker.terminate();
    this.workerPromise = null;
  }
}
