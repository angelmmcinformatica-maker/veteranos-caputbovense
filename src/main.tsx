import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register FCM service worker (also handles caching)
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {
      // SW registration failed silently
    });
    // Register general cache SW
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
