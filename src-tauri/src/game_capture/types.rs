use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GameState {
    NotRunning,
    InLobby,
    MatchStarting,
    InMatch,
    MatchEnding,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GameEvent {
    GameLaunched,
    GameClosed,
    MatchStarted,
    MatchEnded,
    OverlayShow,
    OverlayHide,
    FrameCaptured { width: u32, height: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureConfig {
    pub target_process_name: String,
    pub target_window_title: String,
    pub fps: u32,
    pub capture_borderless: bool,
    pub capture_windowed: bool,
    pub match_start_keywords: Vec<String>,
    pub match_end_keywords: Vec<String>,
    pub log_file_path: Option<String>,
}

impl Default for CaptureConfig {
    fn default() -> Self {
        Self {
            // The TFT game window is hosted by this process on Windows.
            target_process_name: "LeagueClient.exe".to_string(),
            target_window_title: "Teamfight Tactics".to_string(),
            fps: 12,
            capture_borderless: true,
            capture_windowed: true,
            match_start_keywords: vec![
                "Loading".to_string(),
                "Match".to_string(),
                "Game".to_string(),
            ],
            match_end_keywords: vec![
                "Defeat".to_string(),
                "Victory".to_string(),
                "You Win".to_string(),
                "You Lose".to_string(),
                "Back to Lobby".to_string(),
            ],
            log_file_path: None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct CaptureFrame {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub timestamp: Instant,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureStats {
    pub is_running: bool,
    pub is_capturing: bool,
    pub game_state: GameState,
    pub process_id: Option<u32>,
    pub window_handle: Option<String>,
    pub current_fps: f32,
    pub frames_captured: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}
