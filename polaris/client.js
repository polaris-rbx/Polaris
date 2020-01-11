// Require dependencies
const Eris = require('eris');
const { CommandManager, RobloxManager, Database, ErisExtensions, IPC } = require('./util');
ErisExtensions(Eris); // Adds Extensions to Eris

const Collection = require('./util/Collection.js');
const util = require('util');


class Polaris extends Eris.Client {
	constructor(options) {
		super(options.token, options.erisSettings);

		this.Raven = options.Raven;
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
				const rbxId = await this.db.getLink(member.id);
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
			this.Raven.captureException(error, {
				level: 'fatal',
				extra: {
					shardId: shardId
				}
			});
		});

		this.on('messageCreate', async (message) => {
			// Auto Roling
			
			// Process Message
			await this.CommandManager.processMessage(message);
		});
	}

	logError(err, obj) {
		this.Raven.mergeContext({
			extra: obj
		});
		console.log(err);
		if (typeof err === 'object') err = util.inspect(err);
		this.Raven.captureException(err);
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
			const rbxId = await this.db.getLink(member.id);
			if (rbxId) {
				const res = await this.CommandManager.commands.getrole.giveRoles(settings, member, rbxId);
				if (res) {
					if (res.error) return;
					res.title = '[AUTOROLES] Roles Updated';
					const dm = await member.user.getDMChannel();
					dm.sendSuccess(member.user, res);
				}
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