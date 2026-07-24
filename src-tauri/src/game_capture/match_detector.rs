use crate::game_capture::types::{CaptureConfig, GameState};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::System;
use windows::Win32::Foundation::{BOOL, FALSE, LPARAM, TRUE};
use windows::Win32::UI::WindowsAndMessaging::{EnumWindows, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId, IsWindowVisible};

#[derive(Clone)]
pub struct MatchDetector {
    config: CaptureConfig,
    is_running: Arc<AtomicBool>,
    current_state: Arc<Mutex<GameState>>,
    process_id: Arc<Mutex<Option<u32>>>,
    window_handle: Arc<Mutex<Option<isize>>>,
    window_title: Arc<Mutex<Option<String>>>,
}

#[derive(Clone, Copy)]
struct WindowSearchContext {
    target_pid: u32,
    result: *mut std::sync::Mutex<Option<(isize, String)>>,
}

struct Detection {
    process_id: u32,
    window_handle: Option<isize>,
    window_title: Option<String>,
}

unsafe impl Send for WindowSearchContext {}

impl MatchDetector {
    pub fn new(config: CaptureConfig) -> Self {
        Self {
            config,
            is_running: Arc::new(AtomicBool::new(false)),
            current_state: Arc::new(Mutex::new(GameState::NotRunning)),
            process_id: Arc::new(Mutex::new(None)),
            window_handle: Arc::new(Mutex::new(None)),
            window_title: Arc::new(Mutex::new(None)),
        }
    }

    pub fn start(&self) {
        self.is_running.store(true, Ordering::SeqCst);

        let is_running = self.is_running.clone();
        let current_state = self.current_state.clone();
        let process_id = self.process_id.clone();
        let window_handle = self.window_handle.clone();
        let window_title = self.window_title.clone();
        let config = self.config.clone();

        thread::spawn(move || {
            while is_running.load(Ordering::SeqCst) {
                let detection = Self::find_tft_detection(&config);

                *process_id.lock().unwrap() = detection.as_ref().map(|value| value.process_id);
                *window_handle.lock().unwrap() = detection.as_ref().and_then(|value| value.window_handle);
                *window_title.lock().unwrap() = detection.as_ref().and_then(|value| value.window_title.clone());

                let mut state_guard = current_state.lock().unwrap();
                let current = *state_guard;

                let new_state = if let Some(ref value) = detection {
                    Self::determine_state(value.window_title.as_deref(), current, &config)
                } else {
                    GameState::NotRunning
                };

                if new_state != current {
                    println!("[MatchDetector] State changed: {:?} -> {:?} (title: {:?})", current, new_state, detection.as_ref().and_then(|value| value.window_title.as_ref()));
                    *state_guard = new_state;
                }

                drop(state_guard);
                thread::sleep(Duration::from_millis(300));
            }
        });
    }

    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
    }

    pub fn get_state(&self) -> GameState {
        let guard = self.current_state.lock().unwrap();
        *guard
    }

    pub fn is_in_match(&self) -> bool {
        let state = self.get_state();
        matches!(state, GameState::InMatch | GameState::MatchStarting)
    }

    pub fn get_process_id(&self) -> Option<u32> {
        *self.process_id.lock().unwrap()
    }

    pub fn get_window_handle(&self) -> Option<isize> {
        *self.window_handle.lock().unwrap()
    }

    pub fn get_window_title(&self) -> Option<String> {
        self.window_title.lock().unwrap().clone()
    }

    pub fn set_state(&self, state: GameState) {
        let mut guard = self.current_state.lock().unwrap();
        *guard = state;
    }

    fn determine_state(title: Option<&str>, current: GameState, config: &CaptureConfig) -> GameState {
        let Some(title) = title else {
            return if current == GameState::NotRunning { GameState::InLobby } else { current };
        };
        let lower_title = title.to_lowercase();

        // Check for match end keywords
        for keyword in &config.match_end_keywords {
            if lower_title.contains(&keyword.to_lowercase()) {
                if current == GameState::InMatch || current == GameState::MatchStarting {
                    return GameState::MatchEnding;
                }
            }
        }

        // Check for match start keywords
        for keyword in &config.match_start_keywords {
            if lower_title.contains(&keyword.to_lowercase()) {
                if current == GameState::InLobby || current == GameState::NotRunning {
                    return GameState::MatchStarting;
                }
                return GameState::InMatch;
            }
        }

        // Check for lobby
        if lower_title.contains("lobby") || lower_title.contains("teamfight") {
            return GameState::InLobby;
        }

        // A matching TFT window with no game-state keyword is still an open lobby.
        if current == GameState::NotRunning {
            GameState::InLobby
        } else {
            current
        }
    }

    fn find_tft_detection(config: &CaptureConfig) -> Option<Detection> {
        let process_ids = Self::find_process_ids(&config.target_process_name);
        let first_process_id = *process_ids.first()?;
        for process_id in process_ids {
            if let Some((handle, title)) = Self::find_window_by_process_id(process_id) {
                return Some(Detection {
                    process_id,
                    window_handle: Some(handle),
                    window_title: Some(title),
                });
            }
        }
        // The client process can exist briefly before its UI child window appears.
        Some(Detection { process_id: first_process_id, window_handle: None, window_title: None })
    }

    fn find_process_id(process_name: &str) -> Option<u32> {
        Self::find_process_ids(process_name).into_iter().next()
    }

    fn find_process_ids(process_name: &str) -> Vec<u32> {
        let sys = System::new_all();
        let names = [process_name, "LeagueClient.exe", "LeagueClientUx.exe", "LeagueClientUxRender.exe", "League of Legends.exe", "TeamfightTactics.exe"];
        let mut process_ids = Vec::new();
        for name in names {
            for (pid, process) in sys.processes() {
                if process.name().eq_ignore_ascii_case(name) {
                    process_ids.push(pid.as_u32());
                }
            }
        }
        process_ids
    }

    fn find_window_by_process_id(target_pid: u32) -> Option<(isize, String)> {
        let result = std::sync::Mutex::new(None);

        unsafe extern "system" fn enum_proc(hwnd: windows::Win32::Foundation::HWND, lparam: LPARAM) -> BOOL {
            if !IsWindowVisible(hwnd).as_bool() {
                return TRUE;
            }

            let length = GetWindowTextLengthW(hwnd) as usize;
            if length == 0 {
                return TRUE;
            }

            let mut buffer = vec![0u16; length + 1];
            let written = GetWindowTextW(hwnd, &mut buffer);
            if written == 0 {
                return TRUE;
            }

            let title = String::from_utf16_lossy(&buffer[..written as usize]);

            let mut pid = 0u32;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));

            let context = &*(lparam.0 as *const WindowSearchContext);
            if pid == context.target_pid {
                let result_ptr = &*context.result;
                let mut guard = (*result_ptr).lock().unwrap();
                *guard = Some((hwnd.0, title));
                return FALSE;
            }

            TRUE
        }

        unsafe {
            let context = WindowSearchContext {
                target_pid,
                result: &result as *const _ as *mut _,
            };
            let _ = EnumWindows(Some(enum_proc), LPARAM(&context as *const _ as isize));
        }

        let guard = result.lock().unwrap();
        guard.clone()
    }
}
