import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export const test = base.extend({
  context: async ({ context, browserName }, use) => {
    if (browserName !== "chromium")
      await context.addInitScript((engine) => {
        const geolocation = navigator.geolocation;
        const read = geolocation.getCurrentPosition.bind(geolocation);
        // Normalize driver-only timestamps; application freshness checks stay unchanged.
        geolocation.getCurrentPosition = (success, error, options) =>
          read(
            (position) => {
              let timestamp = position.timestamp;
              if (engine === "webkit" && timestamp > Date.now() * 100)
                timestamp /= 1000;
              if (
                engine === "firefox" &&
                Object.prototype.toString.call(position) ===
                  "[object GeolocationPosition]" &&
                Math.abs(timestamp - Date.now() - 86400000) < 300000
              )
                timestamp -= 86400000;
              if (timestamp !== position.timestamp)
                Object.defineProperty(position, "timestamp", {
                  value: timestamp,
                });
              success(position);
            },
            error,
            options,
          );
      }, browserName);
    await use(context);
  },
});
