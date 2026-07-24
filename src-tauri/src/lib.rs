mod game_capture;

use game_capture::{CaptureConfig, GameCaptureService};
use std::sync::Mutex;

// Global state for the capture service
struct AppState {
    capture_service: Mutex<Option<GameCaptureService>>,
}

#[tauri::command]
fn start_capture(state: tauri::State<AppState>, config: Option<CaptureConfig>) -> Result<(), String> {
    let mut service_guard = state.capture_service.lock().map_err(|e| e.to_string())?;
    
    let capture_config = config.unwrap_or_default();
    
    if service_guard.is_none() {
        *service_guard = Some(GameCaptureService::new(capture_config));
    }
    
    if let Some(service) = service_guard.as_ref() {
        service.start();
    }
    
    Ok(())
}

#[tauri::command]
fn stop_capture(state: tauri::State<AppState>) -> Result<(), String> {
    let service_guard = state.capture_service.lock().map_err(|e| e.to_string())?;
    
    if let Some(service) = service_guard.as_ref() {
        service.stop();
    }
    
    Ok(())
}

#[tauri::command]
fn get_capture_stats(state: tauri::State<AppState>) -> Result<game_capture::CaptureStats, String> {
    let service_guard = state.capture_service.lock().map_err(|e| e.to_string())?;
    
    if let Some(service) = service_guard.as_ref() {
        Ok(service.get_stats())
    } else {
        Ok(game_capture::CaptureStats {
            is_running: false,
            is_capturing: false,
            game_state: game_capture::GameState::NotRunning,
            process_id: None,
            window_handle: None,
            current_fps: 0.0,
            frames_captured: 0,
        })
    }
}

#[tauri::command]
fn get_capture_window_bounds(state: tauri::State<AppState>) -> Result<Option<game_capture::WindowBounds>, String> {
    let service_guard = state.capture_service.lock().map_err(|e| e.to_string())?;
    Ok(service_guard.as_ref().and_then(GameCaptureService::get_window_bounds))
}

#[tauri::command]
fn update_capture_config(state: tauri::State<AppState>, config: CaptureConfig) -> Result<(), String> {
    let mut service_guard = state.capture_service.lock().map_err(|e| e.to_string())?;
    
    if let Some(service) = service_guard.as_mut() {
        service.update_config(config);
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            capture_service: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_capture,
            stop_capture,
            get_capture_stats,
            get_capture_window_bounds,
            update_capture_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
