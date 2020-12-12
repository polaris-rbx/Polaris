const { Transaction } = require("@sentry/integrations");
const Sentry = require("@sentry/node");

const { name, version } = require("./package.json");
const Polaris = require("./polaris");
const settings = require("./settings");

//
// Setup Sentry Configuration
if (settings.sentry && settings.sentry !== "") {
  Sentry.init({
    dsn: settings.sentry,
    integrations: [new Transaction()],
    release: `${name}@${version}`
  });
}

const token = process.env.NODE_ENV === "production" ? settings.token : settings.testToken;
const Client = new Polaris.Client({
  token: `Bot ${token}`,
  erisSettings: {
    maxShards: "auto",
    intents: [
      "guilds",
      "guildMembers",
      "guildMessages",
      "directMessages"
    ],
    allowedMentions: { users: true }
  }
});
Client.on("error", console.error);
