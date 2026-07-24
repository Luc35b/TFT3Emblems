export enum GameEventType {
  STAGE_CHANGED = 'STAGE_CHANGED',
  GOLD_CHANGED = 'GOLD_CHANGED',
  HP_CHANGED = 'HP_CHANGED',
  LEVEL_CHANGED = 'LEVEL_CHANGED',
  SHOP_UPDATED = 'SHOP_UPDATED',
  BOARD_UPDATED = 'BOARD_UPDATED',
  BENCH_UPDATED = 'BENCH_UPDATED',
  ITEMS_UPDATED = 'ITEMS_UPDATED',
  COMPONENTS_UPDATED = 'COMPONENTS_UPDATED',
  EMBLEMS_UPDATED = 'EMBLEMS_UPDATED',
  TRAITS_UPDATED = 'TRAITS_UPDATED',
  AUGMENTS_UPDATED = 'AUGMENTS_UPDATED',
}

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: any;
}

export class GameEventManager {
  private eventHistory: GameEvent[] = [];

  emitEvent(type: GameEventType, data: any): void {
    const event: GameEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    this.eventHistory.push(event);
  }

  getEventHistory(): GameEvent[] {
    return this.eventHistory;
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}
