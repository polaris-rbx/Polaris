import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

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
