import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/registerServiceWorker";

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: () => {
      console.log('App is ready to work offline');
    },
    onUpdate: () => {
      console.log('New version available! Please refresh.');
    },
    onOffline: () => {
      console.log('App is running in offline mode');
    },
    onOnline: () => {
      console.log('App is back online');
    }
  });
}
