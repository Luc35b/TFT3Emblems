export enum GameState {
  NotRunning = "NotRunning",
  InLobby = "InLobby",
  MatchStarting = "MatchStarting",
  InMatch = "InMatch",
  MatchEnding = "MatchEnding",
}

export interface CaptureConfig {
  target_process_name: string;
  target_window_title: string;
  fps: number;
  capture_borderless: boolean;
  capture_windowed: boolean;
  match_start_keywords: string[];
  match_end_keywords: string[];
  log_file_path?: string;
}

export interface CaptureStats {
  is_running: boolean;
  is_capturing: boolean;
  game_state: GameState;
  process_id: number | null;
  window_handle: string | null;
  current_fps: number;
  frames_captured: number;
}

export const defaultCaptureConfig: CaptureConfig = {
  // The TFT game client runs in the League of Legends process on Windows.
  target_process_name: "LeagueClient.exe",
  target_window_title: "Teamfight Tactics",
  fps: 12,
  capture_borderless: true,
  capture_windowed: true,
  match_start_keywords: ["Loading", "Match", "Game"],
  match_end_keywords: ["Defeat", "Victory", "You Win", "You Lose", "Back to Lobby"],
  log_file_path: undefined,
};
