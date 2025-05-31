const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://frontend:80',
    specPattern: 'e2e/**/*.cy.js',
    supportFile: 'support/e2e.js',
  },
})