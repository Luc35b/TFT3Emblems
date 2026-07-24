import { AssetManager } from "../Core/AssetManager";
import champions from "../../data/champions.json";

export interface ShopRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShopChampion {
  championId: string;
  cost: number;
}

interface ChampionAsset {
  id: string;
  cost: number;
  image: string;
}

interface OpenCvApi {
  Mat: new (...args: any[]) => any;
  Size: new (width: number, height: number) => any;
  TM_CCOEFF_NORMED: number;
  INTER_AREA: number;
  COLOR_RGBA2GRAY: number;
  imread(source: HTMLCanvasElement): any;
  cvtColor(source: any, destination: any, code: number): void;
  resize(source: any, destination: any, size: any, fx: number, fy: number, interpolation: number): void;
  matchTemplate(source: any, template: any, result: any, method: number): void;
  minMaxLoc(source: any): { maxVal: number };
}

/** Five shop portrait regions, normalized to the full captured TFT frame. */
export const DEFAULT_SHOP_REGIONS: ShopRegion[] = [0, 1, 2, 3, 4].map((slot) => ({
  x: 0.255 + slot * 0.098,
  y: 0.72,
  width: 0.084,
  height: 0.16,
}));

const CHAMPION_MATCH_THRESHOLD = 0.72;
const championAssets = champions as ChampionAsset[];

export class ShopDetector {
  private static readonly templateCache = new Map<string, any>();
  private readonly assetManager: AssetManager;
  private readonly regions: ShopRegion[];
  private readonly matchThreshold: number;
  private readonly cvPromise: Promise<OpenCvApi>;

  constructor(
    assetManager = new AssetManager(),
    regions = DEFAULT_SHOP_REGIONS,
    matchThreshold = CHAMPION_MATCH_THRESHOLD,
  ) {
    if (regions.length !== 5) throw new Error("ShopDetector requires exactly five shop regions.");
    this.assetManager = assetManager;
    this.regions = regions.map((region) => ({ ...region }));
    this.matchThreshold = matchThreshold;
    this.cvPromise = ShopDetector.loadOpenCv();
  }

  /** Returns one result per shop slot; null means empty or below match threshold. */
  async detect(frame: ImageData): Promise<Array<ShopChampion | null>> {
    const cv = await this.cvPromise;
    const slots = this.regions.map((region) => cropToCanvas(frame, region));
    const results: Array<ShopChampion | null> = [];

    for (const slot of slots) {
      results.push(await this.matchSlot(slot, cv));
    }
    return results;
  }

  getRegions(): ShopRegion[] {
    return this.regions.map((region) => ({ ...region }));
  }

  static clearTemplateCache(): void {
    for (const template of ShopDetector.templateCache.values()) {
      template.delete?.();
    }
    ShopDetector.templateCache.clear();
  }

  private async matchSlot(slot: HTMLCanvasElement, cv: OpenCvApi): Promise<ShopChampion | null> {
    const slotImage = cv.imread(slot);
    const slotGray = new cv.Mat();
    cv.cvtColor(slotImage, slotGray, cv.COLOR_RGBA2GRAY);
    slotImage.delete();

    let best: { champion: ChampionAsset; score: number } | null = null;
    for (const champion of championAssets) {
      const template = await this.getTemplate(champion, slot.width, slot.height, cv);
      const result = new cv.Mat();
      cv.matchTemplate(slotGray, template, result, cv.TM_CCOEFF_NORMED);
      const score = cv.minMaxLoc(result).maxVal;
      result.delete();

      if (!best || score > best.score) best = { champion, score };
    }
    slotGray.delete();

    if (!best || best.score < this.matchThreshold) return null;
    return { championId: best.champion.id, cost: best.champion.cost };
  }

  private async getTemplate(champion: ChampionAsset, width: number, height: number, cv: OpenCvApi): Promise<any> {
    const set = this.assetManager.getAsset("tft-set") ?? "17";
    const key = `${set}:${champion.id}:${width}x${height}`;
    const cached = ShopDetector.templateCache.get(key);
    if (cached) return cached;

    const image = await loadImage(champion.image);
    const imageCanvas = document.createElement("canvas");
    imageCanvas.width = image.naturalWidth;
    imageCanvas.height = image.naturalHeight;
    imageCanvas.getContext("2d")?.drawImage(image, 0, 0);
    const source = cv.imread(imageCanvas);
    const sourceGray = new cv.Mat();
    cv.cvtColor(source, sourceGray, cv.COLOR_RGBA2GRAY);
    const template = new cv.Mat();
    cv.resize(sourceGray, template, new cv.Size(width, height), 0, 0, cv.INTER_AREA);
    source.delete();
    sourceGray.delete();
    ShopDetector.templateCache.set(key, template);
    return template;
  }

  private static async loadOpenCv(): Promise<OpenCvApi> {
    const module = await import("@techstark/opencv-js") as unknown as { default?: OpenCvApi } & OpenCvApi;
    const cv = module.default ?? module;
    if (!("Mat" in cv)) {
      await new Promise<void>((resolve) => {
        (cv as OpenCvApi & { onRuntimeInitialized?: () => void }).onRuntimeInitialized = resolve;
      });
    }
    return cv;
  }
}

function cropToCanvas(frame: ImageData, region: ShopRegion): HTMLCanvasElement {
  const x = Math.floor(frame.width * region.x);
  const y = Math.floor(frame.height * region.y);
  const width = Math.max(1, Math.min(frame.width - x, Math.floor(frame.width * region.width)));
  const height = Math.max(1, Math.min(frame.height - y, Math.floor(frame.height * region.height)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.putImageData(frame, -x, -y);
  return canvas;
}

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load champion template: ${path}`));
    image.src = path;
  });
}
