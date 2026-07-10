import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ch.zuerifish.map",
  appName: "ZüriFish",
  webDir: "dist",
  backgroundColor: "#f4f8f5",
  loggingBehavior: "debug",
  zoomEnabled: false,
  android: {
    allowMixedContent: false,
    backgroundColor: "#f4f8f5"
  },
  plugins: {
    SystemBars: {
      hidden: false,
      insetsHandling: "css",
      style: "DARK"
    }
  }
};

export default config;
