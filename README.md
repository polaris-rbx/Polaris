# Polaris

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/934f50cd0c354d4ebd17c0a91fc4855d)](https://app.codacy.com/app/Neztore/Polaris?utm_source=github.com&utm_medium=referral&utm_content=Neztore/Polaris&utm_campaign=Badge_Grade_Settings)
[![Polaris project bot](https://img.shields.io/badge/Polaris%20Project-Roblox%20bot-2bbbad.svg)](https://polaris.codes)

Polaris is an open source Roblox verification bot, created in November 2017 and open sourced in December 2018.

It is currently labelled as `unmaintained` in the sense that I will not be actively improving it or fixing less critical bugs.
If you'd like to take over maintaining the bot, feel free to contact me or just fork and PR some fixes!

This bot is designed to work in tandem with the [Polaris-React webpanel and site](https://github.com/neztore/polaris-react).

Feel free to snoop, edit, hash, contribute to and remix the bot.

## Installing
1.  Clone this repo - `git clone https://github.com/neztore/polaris`
2.  Navigate into new folder `cd polaris`
3.  Run `npm install` in this repo
4.  Create your settings.json. Set `sync` to true
5.  Make sure your rethinkdb database is running
6.  Run it!

##  Setup / config
 ### Config
The Polaris client takes a config object, which can contain:
-  `token` - The bot token to use
-  `erisOptions` - The options to pass to the underlying eris client
-  `Raven` - A Raven client for sentry. Use without this is planned, but currently untested.

It also expects a `settings.json` to exist in the root, with example values as below. We also plan to stop moving this in the near future.
```json
{
	"token": "Main bot token",
	"testToken": "Test bot token",
	"dblToken": "Discord bot list token",
	"sentry": "Sentry token",
	"specialPeople": {
		"93968063": "This user works for Polaris.",
		"66592931": "This user is the Polaris developer.",
		"Roblox id": "Desc string to be shown"
	}
}
```
If you don't want any "special people" just leave that as an empty array.
## Support
Join our [discord](https://discord.gg/QevWabU) for support.

The main [website](https://polaris-bot.xyz/).
