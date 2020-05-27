const settings = require('./settings');
const Raven = require('raven');
const Polaris = require('./polaris');

// Setup Raven Configuration
Raven.config(settings.sentry, {
	captureUnhandledRejections: true,
	autoBreadcrumbs: true,
	sendTimeout: 3
}).install();
const token = process.env.NODE_ENV === 'production' ? settings.token : settings.testToken;
const Client = new Polaris.Client({
	token: `Bot ${token}`,
	Raven,
	erisSettings: {
		maxShards: 'auto',
		intents: [
			"guilds",
			"guildMembers",
			"guildMessages",
			"directMessages"
		]
	}
});
Client.on('error', console.error);
