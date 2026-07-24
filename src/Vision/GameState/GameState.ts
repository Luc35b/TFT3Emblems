export interface GameState {
  stage: string | null;
  gold: number;
  hp: number;
  level: number;
  shop: string[];
  board: any[];
  bench: any[];
  items: any[];
  components: any[];
  emblems: any[];
  traits: any[];
  augments: any[];
}

export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GameState {
    return {
      stage: null,
      gold: 0,
      hp: 100,
      level: 1,
      shop: [],
      board: [],
      bench: [],
      items: [],
      components: [],
      emblems: [],
      traits: [],
      augments: [],
    };
  }

  getState(): GameState {
    return this.state;
  }

  updateState(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial };
  }

  resetState(): void {
    this.state = this.getInitialState();
  }
}
