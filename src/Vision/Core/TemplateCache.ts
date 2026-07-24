export class TemplateCache {
  private cache: Map<string, any> = new Map();

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key) ?? null;
  }
}
