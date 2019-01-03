'use strict';
//Require statements
const settings = require('./settings.json');
const Raven = require('raven');
const Polaris = require('./polaris/client.js');

// Set up Raven
Raven.config(settings.sentry, {
	captureUnhandledRejections: true,
	autoBreadcrumbs: true,
	sendTimeout: 3
}).install();


// Raven error catcher, for anything that isn't caught normally. Shouldn't really be used.
Raven.context(function () {
	const token = process.env.NODE_ENV === "production" ? settings.token : settings.testToken;

	const client = new Polaris({
		token,
		Raven
	}, {
		maxShards: 'auto'
	});

	if (process.env.NODE_ENV === "production") {
		const DBL = require('dblapi.js');
		const dbl = new DBL(settings.dblToken, client); // eslint-disable-line

	} else {
		console.log("Starting in development mode.");
	}

}); // Ends context
