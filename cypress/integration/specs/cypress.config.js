const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: '5hzffr',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
