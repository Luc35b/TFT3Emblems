import { GameState } from './GameState';

export class Store {
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  getState(): GameState {
    return this.state;
  }

  setState(newState: Partial<GameState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
