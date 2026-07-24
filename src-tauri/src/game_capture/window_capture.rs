use crate::game_capture::types::{CaptureConfig, CaptureFrame};
use std::time::Instant;
use sysinfo::System;
use windows::Win32::Foundation::{BOOL, FALSE, LPARAM, RECT, TRUE};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowRect, GetWindowThreadProcessId, IsWindowVisible,
};

pub struct WindowCapture {
    config: CaptureConfig,
}

struct WindowSearchContext {
    target_pid: u32,
    result: *mut std::sync::Mutex<Option<windows::Win32::Foundation::HWND>>,
}

impl WindowCapture {
    pub fn new(config: CaptureConfig) -> Self {
        Self { config }
    }

    pub fn capture_frame(&self) -> Option<CaptureFrame> {
        let process_id = Self::find_process_id(&self.config.target_process_name)?;
        let hwnd = Self::find_window_by_process_id(process_id)?;

        unsafe {
            let mut rect = RECT::default();
            GetWindowRect(hwnd, &mut rect).ok()?;

            let width = (rect.right - rect.left) as u32;
            let height = (rect.bottom - rect.top) as u32;

            if width == 0 || height == 0 {
                return None;
            }

            // Placeholder for actual capture - return empty frame for now
            // TODO: Implement actual BitBlt capture
            let data = vec![0u8; (width * height * 4) as usize];

            Some(CaptureFrame {
                data,
                width,
                height,
                timestamp: Instant::now(),
            })
        }
    }

    fn find_process_id(process_name: &str) -> Option<u32> {
        let sys = System::new_all();
        for (pid, process) in sys.processes() {
            if process.name().eq_ignore_ascii_case(process_name) {
                return Some(pid.as_u32());
            }
        }
        None
    }

    fn find_window_by_process_id(target_pid: u32) -> Option<windows::Win32::Foundation::HWND> {
        let result = std::sync::Mutex::new(None);

        unsafe extern "system" fn enum_proc(
            hwnd: windows::Win32::Foundation::HWND,
            lparam: LPARAM,
        ) -> BOOL {
            if !IsWindowVisible(hwnd).as_bool() {
                return TRUE;
            }

            let mut pid = 0u32;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));

            let context = &*(lparam.0 as *const WindowSearchContext);
            if pid == context.target_pid {
                let result_ptr = &*context.result;
                let mut guard = (*result_ptr).lock().unwrap();
                *guard = Some(hwnd);
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
