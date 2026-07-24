use crate::game_capture::types::{CaptureConfig, CaptureStats, WindowBounds};
use crate::game_capture::match_detector::MatchDetector;
use crate::game_capture::window_capture::WindowCapture;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};
use windows::Win32::Foundation::RECT;
use windows::Win32::UI::WindowsAndMessaging::GetWindowRect;

pub struct GameCaptureService {
    config: CaptureConfig,
    match_detector: MatchDetector,
    is_capturing: Arc<AtomicBool>,
    frames_captured: Arc<AtomicU64>,
}

impl GameCaptureService {
    pub fn new(config: CaptureConfig) -> Self {
        Self {
            match_detector: MatchDetector::new(config.clone()),
            config,
            is_capturing: Arc::new(AtomicBool::new(false)),
            frames_captured: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn start(&self) {
        if self.is_capturing.load(Ordering::SeqCst) {
            return;
        }

        self.is_capturing.store(true, Ordering::SeqCst);
        self.match_detector.start();

        let is_capturing = self.is_capturing.clone();
        let frames_captured = self.frames_captured.clone();
        let window_capture = WindowCapture::new(self.config.clone());
        let match_detector = self.match_detector.clone();
        let fps = self.config.fps;
        let frame_interval = Duration::from_millis(1000 / fps as u64);

        thread::spawn(move || {
            let mut last_frame_time = Instant::now();

            while is_capturing.load(Ordering::SeqCst) {
                let now = Instant::now();
                let elapsed = now - last_frame_time;

                if elapsed < frame_interval {
                    thread::sleep(frame_interval - elapsed);
                }

                if match_detector.is_in_match() {
                    if let Some(_frame) = window_capture.capture_frame() {
                        frames_captured.fetch_add(1, Ordering::SeqCst);
                        last_frame_time = Instant::now();
                    }
                }

                last_frame_time = Instant::now();
            }
        });
    }

    pub fn stop(&self) {
        self.is_capturing.store(false, Ordering::SeqCst);
        self.match_detector.stop();
    }

    pub fn get_stats(&self) -> CaptureStats {
        CaptureStats {
            is_running: self.is_capturing.load(Ordering::SeqCst),
            is_capturing: self.match_detector.is_in_match(),
            game_state: self.match_detector.get_state(),
            process_id: self.match_detector.get_process_id(),
            window_handle: self.match_detector.get_window_handle().map(|handle| handle.to_string()),
            current_fps: 0.0,
            frames_captured: self.frames_captured.load(Ordering::SeqCst),
        }
    }

    pub fn get_window_bounds(&self) -> Option<WindowBounds> {
        let handle = self.match_detector.get_window_handle()?;
        unsafe {
            let mut rect = RECT::default();
            GetWindowRect(windows::Win32::Foundation::HWND(handle), &mut rect).ok()?;
            let width = (rect.right - rect.left) as u32;
            let height = (rect.bottom - rect.top) as u32;
            if width == 0 || height == 0 {
                return None;
            }
            Some(WindowBounds { x: rect.left, y: rect.top, width, height })
        }
    }


    pub fn update_config(&mut self, config: CaptureConfig) {
        self.config = config;
    }
}
