import { Home } from "./pages/Home";
import { DebugOverlay } from "./components/DebugOverlay";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

function App() {
  if (isTauri() && getCurrentWindow().label === "debug-overlay") {
    return <DebugOverlay />;
  }
  return <Home />;
}

export default App;
