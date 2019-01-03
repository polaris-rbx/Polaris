const settings = require('./settings');
const Raven = require('raven');
const Polaris = require('./polaris');

// Setup Raven Configuration
Raven.config(settings.sentry, {
  captureUnhandledRejections: true,
  autoBreadcrumbs: true,
  sendTimeout: 3
}).install();

const Client = new Polaris.Client({
  token: process.env.NODE_ENV === 'production' ? settings.token : settings.testToken,
  Raven,
  erisSettings: {
    maxShards: 'auto'
  }
})