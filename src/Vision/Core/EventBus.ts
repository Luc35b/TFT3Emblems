export class EventBus {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  emit(event: string, data: any): void {
    for (const callback of this.listeners.get(event) ?? []) {
      callback(data);
    }
  }
}
