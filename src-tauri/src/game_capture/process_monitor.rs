use crate::game_capture::types::CaptureConfig;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

pub struct ProcessMonitor {
    config: CaptureConfig,
    is_running: Arc<AtomicBool>,
    process_id: Arc<std::sync::Mutex<Option<u32>>>,
    last_running: Arc<std::sync::Mutex<bool>>,
}

impl ProcessMonitor {
    pub fn new(config: CaptureConfig) -> Self {
        Self {
            config,
            is_running: Arc::new(AtomicBool::new(false)),
            process_id: Arc::new(std::sync::Mutex::new(None)),
            last_running: Arc::new(std::sync::Mutex::new(false)),
        }
    }

    pub fn start(&self) {
        self.is_running.store(true, Ordering::SeqCst);

        let is_running = self.is_running.clone();
        let process_id = self.process_id.clone();
        let last_running = self.last_running.clone();
        let target_name = self.config.target_process_name.clone();

        thread::spawn(move || {
            while is_running.load(Ordering::SeqCst) {
                let running = Self::check_process_running(&target_name);
                let pid = if running {
                    Self::find_process_id(&target_name)
                } else {
                    None
                };

                let mut last = last_running.lock().unwrap();
                let was_running = *last;
                *last = running;

                if let Ok(mut id_guard) = process_id.lock() {
                    *id_guard = pid;
                }

                drop(last);

                if running != was_running {
                    if running {
                        println!(
                            "[ProcessMonitor] Process '{}' detected (PID: {:?})",
                            target_name, pid
                        );
                    } else {
                        println!("[ProcessMonitor] Process '{}' no longer running", target_name);
                    }
                }

                thread::sleep(Duration::from_millis(500));
            }
        });
    }

    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
    }

    pub fn is_process_running(&self) -> bool {
        let last = self.last_running.lock().unwrap();
        *last
    }

    pub fn get_process_id(&self) -> Option<u32> {
        let guard = self.process_id.lock().unwrap();
        *guard
    }

    pub fn was_running(&self) -> bool {
        let last = self.last_running.lock().unwrap();
        *last
    }

    fn check_process_running(process_name: &str) -> bool {
        Self::find_process_id(process_name).is_some()
    }

    fn find_process_id(process_name: &str) -> Option<u32> {
        use sysinfo::System;

        let sys = System::new_all();
        for (pid, process) in sys.processes() {
            let proc_name = process.name();
            if proc_name.eq_ignore_ascii_case(process_name) {
                return Some(pid.as_u32());
            }
        }
        None
    }
}
