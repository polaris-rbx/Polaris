const requestLib = require('request-promise');
const request = async function (obj) {
	if (typeof obj === "string") {

		const startTime = new Date();
		let resp = await requestLib(obj);
		let doneTime = new Date();
		console.log(`GET to ${obj} took ${doneTime.getTime() - startTime.getTime()}ms`);
		return resp;
	}
	const startTime = new Date();
	let resp = await requestLib(obj);
	let doneTime = new Date();
	console.log(`${obj.method || "GET"} to ${obj.uri} took ${doneTime.getTime() - startTime.getTime()}ms`);
	return resp;
};
class Group {
	constructor (groupId) {
		this.id = groupId;
		this.users = new Map();
	}
	clearCache () {
		// Clear rank cache
		this.users.clear();
	}
	async getRank (userIdOrUserClass) {
		if (!userIdOrUserClass) return;
		const id = typeof userIdOrUserClass === 'number' || typeof userIdOrUserClass === 'string' ? userIdOrUserClass : userIdOrUserClass.id;
		if (this.users.get(id)) {
			// Possible cache hit
			if (this.users.get(id).rank !== undefined) return this.users.get(id).rank;
		}
		const options = {
			method: 'GET',
			uri: `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=${id}&groupId=${this.id}`,
			resolveWithFullResponse: true
		};
		try {
			let res = await request(options);
			res = parseInt(res.body.substring(22), 10);
			if (this.users.get(id)) {
				const cache = this.users.get(id);
				cache.rank = res;
				this.users.set(id, cache);
			} else {
				this.users.set(id, {rank: res});
			}
			return res;
		} catch (error) {
			if (error.statusCode === 404 || 400) return {error: {status: 404, message: 'User or group not found'}};
			if (error.statusCode === 503) return {error: {status: 503, message: 'Service Unavailible - Roblox is down.'}};
			throw new Error(error);
		}
	}
	async getRole (userIdOrUserClass) {
		if (!userIdOrUserClass) return;
		const id = typeof userIdOrUserClass === 'number' || typeof userIdOrUserClass === 'string' ? userIdOrUserClass : userIdOrUserClass.id;
		const cache = this.users.get(id);
		if (cache) {
			// Possible cache hit
			const role = this.users.get(id).role;
			if (role) return role;
		}
		const options = {
			method: 'GET',
			uri: `https://www.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${id}&groupId=${this.id}`,
			resolveWithFullResponse: true
		};
		try {
			let res = await request(options);
			res = res.body;
			if (this.users.get(id)) {
				this.users.get(id).role = res;
			} else {
				this.users.set(id, {role: res});
			}
			return res;
		} catch (error) {
			if (error.statusCode === 404 || 400) return {error: {status: 404, message: 'User or group not found'}};
			if (error.statusCode === 503) return {error: {status: 503, message: 'Service Unavailible - Roblox is down.'}};
			throw new Error(error);
		}
	}
	async updateInfo () {
		try {
			let res = await request(`https://api.roblox.com/groups/${this.id}`);
			res = JSON.parse(res);
			this.name = res.Name;
			this.roles = res.Roles;
			this.description = res.Description;
			this.owner = res.Owner;
			this.emblemUrl = res.EmblemUrl;

		} catch (error) {
			if (error.statusCode === 404) return {error: {status: 404, message: 'Group not found'}};
			if (error.statusCode === 503) return {error: {status: 503, message: 'Group info not available'}};
			// Not 404
			throw new Error(error);
		}
	}
	async getRoles () {
		if (this.roles) return this.roles;

		const res = await this.updateInfo();
		if (res.error) return res;
		return this.Roles;
	}
}

module.exports = Group;
