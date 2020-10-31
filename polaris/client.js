// Require dependencies
const Eris = require('eris');
const { CommandManager, RobloxManager, Database, ErisExtensions, IPC } = require('./util');
ErisExtensions(Eris); // Adds Extensions to Eris
const {withScope, captureException, Severity, captureEvent, captureMessage} = require("@sentry/node")

const Collection = require('./util/Collection.js');
const util = require("util");
const { getLink } = require("./util/linkManager");

class Polaris extends Eris.Client {
	constructor(options) {
		super(options.token, options.erisSettings);
		this.eris = Eris;

		// Queue Stuff (Really shouldn't be here)
		this.linkQueue = new Collection();
		this.cooldown = new Set();
		this.autoUpdateCooldown = new Map();
		this.start();
	}

	load() {
		this.CommandManager = new CommandManager(this);
		this.db = new Database(this); // Database Manager
		this.IPC = new IPC(this, {allowLog: false}); // IPC Manager
		this.roblox = new RobloxManager(this); // Roblox Manager
		this.ownerId = this.options.ownerId || '183601072344924160'; // Bot Owner Id
	}

	loadEvents() {
		this.on('ready', () => {
			console.log(`Bot now running on ${this.guilds.size} servers`);
			this.editStatus('online', {name: `${this.guilds.size} servers | .help`, type: 3});
		});
		this.on('error', (e) => {
			this.logError(e);
		});
		if (process.env.NODE_ENV !== "production") {
			this.on('debug', (m) => {
				// Removes token from debug output
				const token = this.token;
				function checkObj (obj, depth = 0) {
					if (depth === 4) {
						return false;
					} else {
						for (const key of Object.keys(obj)) {
							if (key === "token" || obj[key] === token) {
								obj[key] = "Token removed"
							} else if (typeof obj[key] === "object") {
								return checkObj(obj[key], depth + 1)
							} else if (typeof obj[key] === "string") {
								obj[key] = obj[key].replace(new RegExp(token), "TokenRemoved");
							}
						}
					}
				}
				if (typeof m === "string") {
					m = m.replace(new RegExp(token, "g"), "TokenRemoved");
				} else if (typeof m === "object") {
					checkObj(m);
				}

				console.log(`DEBUG: `, util.inspect(m, {
					depth: 4,
				}))
			});
		}

		this.on('disconnect', () => {
			captureMessage("Client Disconnect");
			console.error(`Client disconnect!`)
		});

		this.on('guildCreate', async guild => {
			console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
			this.editStatus('online', {name: `${this.guilds.size} servers | .help`, type: 3});
		});

		this.on('guildDelete', async guild => {
			console.log(`Guild ${guild.name} has removed Polaris.`);
			this.editStatus('online', {name: `${this.guilds.size} servers | .help`, type: 3});
		});

		this.on('guildMemberAdd', async (guild, member) => {
			if (member.bot) return;
			const settings = await this.db.getSettings(guild.id);

			if (settings.autoVerify) {
				const rbxId = await getLink(member.id);
				if (rbxId) {
					const res = await this.CommandManager.commands.getrole.giveRoles(settings, member, rbxId);
					if (res) {
						if (res.error) return;
						res.title = 'Welcome to ' + guild.name;
						const dm = await member.user.getDMChannel();
						dm.sendSuccess(member.user, res);
					}
				} else {
					await this.CommandManager.commands.getrole.verifiedRoles(false, member);
				}
			}
		});

		this.on('error', (error, shardId) => {
			withScope((scope) =>{
				scope.setLevel(Severity.Fatal);
				scope.setExtra("shard", shardId);
				captureException(error);
			});
		});

		this.on('messageCreate', async (message) => {
			// Process Message
			await this.CommandManager.processMessage(message);
		});
	}

	logError(err, obj) {
		withScope((scope) =>{
			scope.setLevel(Severity.Fatal);
			if (obj) {
				for (let key of Object.keys(obj)) {
					scope.setExtra(key, obj[key]);
				}
			}
			captureException(err);
		});
	}

	// this shouldnt really be here
	async autoRole(member) {
		if (member.bot) return;
		const cooldown = this.autoUpdateCooldown.get(member.user.id);
		if (cooldown) {
			// 30min
			if ((cooldown + 1800000 > Date.now())) {
				// It hasn't expired
				return;
			} else {
				this.autoUpdateCooldown.delete(member.user.id);
			}//
		}
		this.autoUpdateCooldown.set(member.user.id, Date.now());
		const settings = await this.db.getSettings(member.guild.id);
		if (settings.autoVerify) {
			const rbxId = await getLink(member.id);
			if (rbxId) {
				// eslint-disable-next-line no-unused-vars
				const res = await this.CommandManager.commands.getrole.giveRoles(settings, member, rbxId);
				/*
				Got a lot of complaints regarding this
				if (res) {

					if (res.error) return;
					res.title = '[AUTOROLES] Roles Updated';
					const dm = await member.user.getDMChannel();
					dm.sendSuccess(member.user, res);
				}*/
			} else {
				await this.CommandManager.commands.getrole.verifiedRoles(false, member);
			}
		}
	}

	start() {
		this.load();
		this.loadEvents();
		this.connect();
	}
}

module.exports = Polaris;
