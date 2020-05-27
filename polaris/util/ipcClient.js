const IPC = require('node-ipc');

class IPCClient {
	constructor(client, config) {
		config = config || {};
		this.allowLog = config.allowLog !== undefined ? config.allowLog : true;
		this.client = client;
		IPC.config.id = config.id || 'polarisClient';
		IPC.config.retry = config.retry || 3000;
		IPC.config.silent = config.silent || true;
		this.client.on('ready', this.start.bind(this));
	}
	start () {
		this.client.removeListener('ready', this.start);
		IPC.connectTo('polarisServer', this.setup.bind(this));
	}
	setup () {
		const ws = IPC.of.polarisServer;
		this._ws = ws;

		ws.on('connect', this.connected.bind(this));
		ws.on('disconnect', this.disconnect.bind(this));
		ws.on('error', this.error.bind(this));

		ws.on('botCheck', this.botCheck.bind(this));
		ws.on("getRoles", this.getRoles.bind(this));


	}
	connected () {
		this.log('Connected!');
	}

	disconnect () {
		this.log(`Disconnected! Attempting re-connection.`);
	}

	error (error){
		if (error.code === 'ENOENT') {
			this.log(`Server has disconnected. Error caught.`);
		} else {
			throw new Error(error);
		}
	}
	// Checks if bot is in server
	botCheck (msg) {
		msg = JSON.parse(msg);
		const guild = this.client.guilds.get(msg.data.guildId);
		if (guild) {
			this.sendObject('botCheckRes', {data: true, _id: msg._id});
		} else {
			this.sendObject('botCheckRes', {data: false, _id: msg._id});
		}
	}

	getRoles (msg) {
		msg = JSON.parse(msg);
		const guild = this.client.guilds.get(msg.data.guildId);
		if (!guild) {
			// return some type of error
			this.sendObject('getRolesRes', {data: {
				error: {
					status: 401, message: "Polaris is not in guild."
				}}, _id: msg._id});
		}
		const roles = [];
		guild.roles.forEach(function (role) {
			roles.push({
				id: role.id,
				name: role.name,
				color: role.color,
				position: role.position
			});
		});
		this.sendObject('getRolesRes', {data: roles, _id: msg._id});

	}
	get ws () {
		return this._ws;
	}
	log (...args) {
		if (this.allowLog) {
			console.log(`IPC: `, ...args);
		}
	}
	sendObject (type, object) { this.ws.emit(type, JSON.stringify(object)); }
}
module.exports = IPCClient;