import { defineConfig } from "cypress";
import * as fs from "fs";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on("task", {
        downloads(downloadsPath) {
          return fs.readdirSync(downloadsPath);
        },
      });
    },
    baseUrl: "http://localhost:5173",
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    supportFile: "cypress/support/component.tsx",
  },
});
