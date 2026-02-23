import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA
try {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      try {
        navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      } catch {
        // SW registration failed silently - iOS privacy mode
      }
    });
  }
} catch {
  // SW not supported
}

createRoot(document.getElementById("root")!).render(<App />);
