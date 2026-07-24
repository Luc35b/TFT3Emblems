import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
import { DEFAULT_STAGE_CROP } from "../Vision/Detectors/StageDetector";
import { DEFAULT_GOLD_CROP } from "../Vision/Detectors/GoldDetector";
import { DEFAULT_HP_CROP } from "../Vision/Detectors/HPDetector";
import { DEFAULT_LEVEL_CROP } from "../Vision/Detectors/LevelDetector";
import { DEFAULT_SHOP_REGIONS } from "../Vision/Detectors/ShopDetector";

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const debugRegions = [
  { label: "Stage Detector OCR crop", region: DEFAULT_STAGE_CROP, className: "stage" },
  { label: "Gold Detector OCR crop", region: DEFAULT_GOLD_CROP, className: "gold" },
  { label: "Player HP Detector OCR crop", region: DEFAULT_HP_CROP, className: "hp" },
  { label: "Player Level Detector OCR crop", region: DEFAULT_LEVEL_CROP, className: "level" },
];

const shopRegions = DEFAULT_SHOP_REGIONS.map((region, index) => ({
  label: `Shop slot ${index + 1}`,
  region,
}));

export function DebugOverlay() {
  const [bounds, setBounds] = useState<WindowBounds | null>(null);

  useEffect(() => {
    const overlayWindow = getCurrentWindow();
    void overlayWindow.setIgnoreCursorEvents(true);

    const update = async () => {
      try {
        const nextBounds = await invoke<WindowBounds | null>("get_capture_window_bounds");
        if (!nextBounds) return;
        setBounds(nextBounds);
        await overlayWindow.setPosition(new PhysicalPosition(nextBounds.x, nextBounds.y));
        await overlayWindow.setSize(new PhysicalSize(nextBounds.width, nextBounds.height));
      } catch (error) {
        console.error("Unable to position debug overlay:", error);
      }
    };

    void update();
    const timer = window.setInterval(() => void update(), 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="debug-screen-overlay" aria-label="Stage detector debug overlay">
      {bounds && debugRegions.map(({ label, region, className }) => (
        <div
          key={label}
          className={`debug-region-crop ${className}`}
          style={{
            left: `${region.x * 100}%`,
            top: `${region.y * 100}%`,
            width: `${region.width * 100}%`,
            height: `${region.height * 100}%`,
          }}
        >
          <span>{label}</span>
        </div>
      ))}
      {bounds && shopRegions.map(({ label, region }) => (
        <div
          key={label}
          className="debug-region-crop shop"
          style={{
            left: `${region.x * 100}%`,
            top: `${region.y * 100}%`,
            width: `${region.width * 100}%`,
            height: `${region.height * 100}%`,
          }}
        >
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
