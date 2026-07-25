import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { EmblemButton } from "../components/EmblemButton";
import { CompCard } from "../components/CompCard";
import { CompDetails } from "../components/CompDetails";
import { Search, ChevronUp, Bug } from "lucide-react";
import emblemsData from "../data/emblems.json";
import compsData from "../data/comps.json" with { type: "json" };
import metadata from "../data/metadata.json" with { type: "json" };
import { findComps } from "../lib/findComps";
import { Comp } from "../types/Comp";
import { GameCaptureExample } from "../components/GameCaptureExample";
import { Header } from "../components/Header";

type Screen = "select" | "results" | "details";

export function Home() {
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [screen, setScreen] = useState<Screen>("select");
  const [results, setResults] = useState<Comp[]>([]);
  const [selectedComp, setSelectedComp] = useState<Comp | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    void getCurrentWindow().setSize(new LogicalSize(500, isCollapsed ? 44 : 392));
  }, [isCollapsed]);

  const setDebugOverlayVisible = async (visible: boolean) => {
    if (!isTauri()) return;
    const overlay = await WebviewWindow.getByLabel("debug-overlay");
    if (!overlay) return;
    if (visible) {
      await overlay.show();
    } else {
      await overlay.hide();
    }
  };

  const toggleDebugMode = () => {
    const nextValue = !isDebugMode;
    setIsDebugMode(nextValue);
    void setDebugOverlayVisible(nextValue);
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait)
        ? prev.filter((t) => t !== trait)
        : [...prev, trait]
    );
  };

  const handleFindComp = () => {
    const foundComps = findComps(compsData as Comp[], selectedTraits);
    setResults(foundComps);
    setScreen("results");
  };

  const handleCompClick = (comp: Comp) => {
    setSelectedComp(comp);
    setScreen("details");
  };

  const handleBack = () => {
    setScreen("results");
    setSelectedComp(null);
  };

  const handleReset = () => {
    setSelectedTraits([]);
    setScreen("select");
    setResults([]);
    setSelectedComp(null);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !isTauri()) return;

    const target = event.target as HTMLElement;
    if (target.closest('[data-tauri-drag-region="false"]')) return;

    void getCurrentWindow().startDragging().catch((error: unknown) => {
      console.error("Unable to start window drag:", error);
    });
  };

  return (
    <div className={`home${isCollapsed ? " collapsed" : ""}`} data-tauri-drag-region onMouseDown={handleMouseDown}>
      {isCollapsed ? (
        <Header title="TFT J Helper" isCollapsed onCollapse={() => setIsCollapsed(false)} />
      ) : (
        <>
          <button
            onClick={() => setIsCollapsed(true)}
            data-tauri-drag-region="false"
            className="home-collapse-button"
            aria-label="Collapse overlay"
          >
            <ChevronUp className="home-collapse-button-icon" />
          </button>

          <button
            onClick={toggleDebugMode}
            data-tauri-drag-region="false"
            className={`home-debug-button${isDebugMode ? " active" : ""}`}
            title={isDebugMode ? "Hide debug diagnostics" : "Show debug diagnostics"}
            aria-label={isDebugMode ? "Hide debug diagnostics" : "Show debug diagnostics"}
          >
            <Bug className="home-debug-button-icon" />
          </button>

        <main className="home-main">
          {isDebugMode && <GameCaptureExample />}
          {screen === "select" && (
            <div className="home-section">
              <div className="home-header">
                <div className="home-header-top">
                  <h2 className="home-header-title">
                    Select Your Emblems ({selectedTraits.length})
                  </h2>
                  <select className="home-set-select" data-tauri-drag-region="false">
                    <option>Set {metadata.set}</option>
                  </select>
                </div>
                <div className="home-traits-grid">
                  {emblemsData.map((emblem) => (
                    <EmblemButton
                      key={emblem.id}
                      trait={emblem.name}
                      image={emblem.emblem}
                      isSelected={selectedTraits.includes(emblem.name)}
                      onClick={() => toggleTrait(emblem.name)}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleFindComp}
                disabled={selectedTraits.length === 0}
                data-tauri-drag-region="false"
                className="home-find-button"
              >
                <Search className="home-find-button-icon" />
                Find Comp
              </button>
            </div>
          )}

          {screen === "results" && (
            <div className="home-section">
              <div className="mb-6">
                <button
                  onClick={handleReset}
                  data-tauri-drag-region="false"
                  className="home-back-button"
                >
                  ← Back to Selection
                </button>
              </div>

              <div className="mb-4">
                <h2 className="home-results-title">Top Compositions</h2>
                <p className="home-results-subtitle">Based on your emblems</p>
              </div>

              {results.length === 0 ? (
                <div className="home-empty">
                  <p className="home-empty-text">
                    No compositions match your selected emblems.
                  </p>
                  <p className="home-empty-subtext">
                    Try selecting different traits.
                  </p>
                </div>
              ) : (
                <div className="home-results-grid">
                  {results.slice(0, 3).map((comp, index) => (
                    <CompCard
                      key={comp.name}
                      comp={comp}
                      rank={index + 1}
                      onClick={() => handleCompClick(comp)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {screen === "details" && selectedComp && (
            <div className="home-section" style={{ maxWidth: "56rem" }}>
              <CompDetails comp={selectedComp} onBack={handleBack} />
            </div>
          )}
        </main>
        </>
      )}
    </div>
  );
}
