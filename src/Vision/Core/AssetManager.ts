export class AssetManager {
  private assets: Map<string, any> = new Map();

  loadAsset(key: string, path: string): void {
    this.assets.set(key, path);
  }

  getAsset(key: string): any {
    return this.assets.get(key) ?? null;
  }
}
