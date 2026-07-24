import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GameState, CaptureConfig, CaptureStats, defaultCaptureConfig } from '../types/GameCapture';

export function useGameCapture(config?: CaptureConfig) {
  const [stats, setStats] = useState<CaptureStats>({
    is_running: false,
    is_capturing: false,
    game_state: GameState.NotRunning,
    process_id: null,
    window_handle: null,
    current_fps: 0,
    frames_captured: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCapture = useCallback(async () => {
    try {
      setError(null);
      const captureConfig = config || defaultCaptureConfig;
      await invoke('start_capture', { config: captureConfig });
      setIsInitialized(true);
    } catch (err) {
      setError(err as string);
      console.error('Failed to start capture:', err);
    }
  }, [config]);

  const stopCapture = useCallback(async () => {
    // Update the control immediately; the native command may take a moment to return.
    setIsInitialized(false);
    try {
      setError(null);
      await invoke('stop_capture');
    } catch (err) {
      setError(err as string);
      console.error('Failed to stop capture:', err);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: CaptureConfig) => {
    try {
      setError(null);
      await invoke('update_capture_config', { config: newConfig });
    } catch (err) {
      setError(err as string);
      console.error('Failed to update config:', err);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      setError(null);
      const newStats = await invoke<CaptureStats>('get_capture_stats');
      setStats(newStats);
    } catch (err) {
      setError(err as string);
      console.error('Failed to get stats:', err);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshStats();
    }, 500);

    return () => clearInterval(interval);
  }, [isInitialized, refreshStats]);

  return {
    stats,
    isInitialized,
    error,
    startCapture,
    stopCapture,
    updateConfig,
    refreshStats,
    isInMatch: stats.game_state === GameState.InMatch || stats.game_state === GameState.MatchStarting,
    isCapturing: stats.is_capturing,
  };
}
