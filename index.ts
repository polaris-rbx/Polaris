import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

import Client from "./src/Client";

const { sentryToken } = process.env;

if (sentryToken) {
  Sentry.init({
    dsn: sentryToken,

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
    integrations: [
      new Tracing.Integrations.Postgres()
    ]
  });
} else {
  console.log("No sentry token: Sentry is not active.");
}

const { token } = process.env;
if (!token) throw new Error("No bot token provided");
const client = new Client(`Bot ${token}`, { restMode: true });
client.connect().catch(e => {
  console.log(e);
  Sentry.captureException(e);
});
