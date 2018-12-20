const request = require('request-promise');
const userClass = require('./baseClasses/user.js');
const groupClass = require('./baseClasses/group.js');

class Roblox {
	constructor (client) {
		this.client = client;
		this._userCache = new Map();
		this._groupCache = new Map();

		// base classes:
		this._user = userClass;
		this._group = groupClass;

		// Cache clear timers
		const Roblox = this;

		// Clear group cache (Group info & ranks - everything.)
		setInterval(function () { Roblox._groupCache.clear(); console.log('Cleared full Group cache'); }, 3600000);
		setInterval(function () { Roblox._userCache.clear(); console.log('Cleared user cache'); }, 7200000);
		// Clear group RANK cache
		setInterval(function () {
			Roblox.clearRanks();

			console.log('Cleared Group rank cache');

		}, 600000);
		this.clearRanks = ()=>	Roblox._groupCache.forEach((group)=>group.clearCache());

	}

	async _createUser (id) {
		const roblox = this;
		try {
			let res = await request(`https://api.roblox.com/users/${id}`);
			if (res) {
				const newUser = new roblox._user(this, id);
				res = JSON.parse(res);
				newUser.username = res.Username;
				roblox._userCache.set(id, newUser);
				return newUser;
			} else return {error: {status: 404, message: 'User does not exist'}};
		} catch (err) {
			if (err.statusCode === 404) {
				return {error: {status: 404, message: 'User does not exist'}};
			}
			if (err.statusCode === 503) return {error: {status: 503, message: 'Service Unavailible - Roblox is down.'}};
			// Not 404, put to sentry in future
			throw Error(err);
		}
	}
	async getUser (id) {
		if (!this._userCache.get(id)) {
			return this._createUser(id);
		} else {
			return this._userCache.get(id);
		}
	}
	async getUserFromName (name) {
		try {
			let res = await request(`https://api.roblox.com/users/get-by-username?username=${name}`);
			if (res) {
				res = JSON.parse(res);
				if (!res.Id) {
					if (res.errorMessage === 'User not found') return {error: {status: 404, message: res.errorMessage}};
					this.client.logError(res);
					return {error: {status: 0, message: res}};
				}
				const newUser = new this._user(this, res.Id);

				newUser.username = res.Username;
				this._userCache.set(res.Id, newUser);
				return newUser;
			} else return {error: {status: 404, message: 'User does not exist'}};
		} catch (err) {
			if (err.statusCode === 404) {
				return {error: {status: 404, message: 'User does not exist'}};
			}
			if (err.statusCode === 503) return {error: {status: 503, message: 'Service Unavailible - Roblox is down.'}};
			this.client.logError(err);
		}
	}
	async getGroup (id) {
		if (!id) return {error: {status: 400, message: 'Group id is required'}};
		if (this._groupCache.get(id)) {
			return this._groupCache.get(id);
		}
		const roblox = this;
		// Group does not already exist!
		try {
			let res = await request(`https://api.roblox.com/groups/${id}`);
			res = JSON.parse(res);
			const newGroup = new roblox._group(res.Id);
			newGroup.name = res.Name;
			newGroup.roles = res.Roles;
			newGroup.description = res.Description;
			newGroup.owner = res.Owner;
			newGroup.emblemUrl = res.EmblemUrl;

			roblox._groupCache.set(id, newGroup);
			return newGroup;
		} catch (error) {
			if (error.statusCode === 404 || 500) return {error: {status: 404, message: 'Group not found'}};
			if (error.statusCode === 503) return {error: {status: 503, message: 'Group info not available'}};
			// Not 404
			this.client.logError(error);
		}
	}

	// API FUNCTIONS. Return simple things, not classes.
	async getIdFromName (Username) {
		const res = await this.getUserFromName(Username);
		if (res.error) return res.error;
		return res.id;
	}
	async getNameFromId (id) {
		const res = this.getUser(id);
		if (res.error) return res.error;
		return res.id;
	}
}
module.exports = Roblox;
