use crate::game_capture::types::GameEvent;
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::Arc;
use std::sync::Mutex;

pub struct GameEventSystem {
    sender: Sender<GameEvent>,
    receiver: Arc<Mutex<Receiver<GameEvent>>>,
}

impl GameEventSystem {
    pub fn new() -> Self {
        let (sender, receiver) = mpsc::channel();
        Self {
            sender,
            receiver: Arc::new(Mutex::new(receiver)),
        }
    }

    pub fn emit(&self, event: GameEvent) {
        let _ = self.sender.send(event);
    }

    pub fn subscribe(&self) -> Arc<Mutex<Receiver<GameEvent>>> {
        self.receiver.clone()
    }
}

impl Default for GameEventSystem {
    fn default() -> Self {
        Self::new()
    }
}
