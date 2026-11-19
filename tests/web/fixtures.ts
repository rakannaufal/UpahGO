import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export const test = base.extend({
  context: async ({ context, browserName }, use) => {
    if (browserName === "webkit")
      await context.addInitScript(() => {
        const geolocation = navigator.geolocation;
        const read = geolocation.getCurrentPosition.bind(geolocation);
        // Playwright's WebKit override emits microseconds; real browser fixes use milliseconds.
        geolocation.getCurrentPosition = (success, error, options) =>
          read(
            (position) => {
              if (position.timestamp > Date.now() * 100)
                Object.defineProperty(position, "timestamp", {
                  value: position.timestamp / 1000,
                });
              success(position);
            },
            error,
            options,
          );
      });
    await use(context);
  },
});
