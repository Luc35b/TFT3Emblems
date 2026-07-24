import { useEffect } from 'react';
import { useGameCapture } from '../hooks/useGameCapture';

export function GameCaptureExample() {
  const {
    stats,
    isInitialized,
    error,
    startCapture,
    stopCapture,
    isInMatch,
    isCapturing,
  } = useGameCapture();

  useEffect(() => {
    void startCapture();
    return () => {
      void stopCapture();
    };
  }, [startCapture, stopCapture]);

  const handleStart = () => {
    startCapture();
  };

  const handleStop = () => {
    stopCapture();
  };

  return (
    <div className="game-capture-example">
      <h2>Game Capture Control</h2>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}

      <div className="controls" style={{ marginBottom: '1rem' }}>
        {!isInitialized ? (
          <button 
            onClick={handleStart}
            data-tauri-drag-region="false"
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Start Detection
          </button>
        ) : (
          <button 
            onClick={handleStop}
            data-tauri-drag-region="false"
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Stop Detection
          </button>
        )}
      </div>

      {isInitialized && (
        <div className="stats" style={{ 
          padding: '1rem', 
          backgroundColor: '#f5f5f5',
          color: '#111827',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          <h3>Capture Statistics</h3>
          <div>Status: {stats.is_running ? 'Running' : 'Stopped'}</div>
          <div>Capturing: {isCapturing ? 'Yes' : 'No'}</div>
          <div>Game State: {stats.game_state}</div>
          <div>In Match: {isInMatch ? 'Yes' : 'No'}</div>
          <div>Process ID: {stats.process_id || 'N/A'}</div>
          <div>Window Handle: {stats.window_handle || 'N/A'}</div>
          <div>TFT Process: {stats.process_id ? 'DETECTED' : 'NOT DETECTED'}</div>
          <div>TFT Window: {stats.window_handle ? 'DETECTED' : 'NOT DETECTED'}</div>
          <div>Current FPS: {stats.current_fps.toFixed(1)}</div>
          <div>Frames Captured: {stats.frames_captured}</div>
        </div>
      )}

      {isInMatch && (
        <div className="overlay-indicator" style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Overlay should VISIBLE (In Match)
        </div>
      )}

      {!isInMatch && isInitialized && (
        <div className="overlay-indicator" style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f44336',
          color: 'white',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Overlay should HIDDEN (Not In Match)
        </div>
      )}
    </div>
  );
}
