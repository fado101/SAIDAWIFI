import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import App from "./App";
import "./index.css";

// Initialize Capacitor when running on mobile
if (Capacitor.isNativePlatform()) {
  // Configure status bar
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#3b82f6' });
  
  // Configure keyboard
  Keyboard.setAccessoryBarVisible({ isVisible: false });
  
  // Hide splash screen after app loads
  setTimeout(async () => {
    if (Capacitor.isPluginAvailable('SplashScreen')) {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      SplashScreen.hide();
    }
  }, 500);
}

createRoot(document.getElementById("root")!).render(<App />);
