const request = require("../request");
const Cheerio = require('cheerio');
/* INFO WITH USER CLASS:
  * User.id: User ID. Always set
  * User.username: Roblox Name. Always set.
  * User.age, User.blurb, User.status, User.joinDate: Roblox Profile info. *Not* always set.
 */
class User {
	constructor (Roblox, userId) {
		this.roblox = Roblox;
		this.id = userId;
	}
	async getUsername () {
		if (this.username) {
			return this.username;
		} else {
			await this.updateUsername();
			return this.username;
		}
	}
	// RETURNS: USERNAME OR NULL FOR FAIL.
	async updateUsername () {
		const user = this;
		let res = await request(`https://api.roblox.com/users/${this.id}`);
		res = await res.json();
		user.username = res.Username;
	}

	async getInfo () {
		// Check for player info fetched
		if (this.age) {
			return {
				age: this.age,
				blurb: this.blurb,
				status: this.status,
				username: this.username,
				joinDate: this.joinDate
			};
		} else {
			return this.updateInfo();
		}
	}

	async updateInfo () {
		if (!this.id) {
			return {error: {message: 'Id is not defined. Please try again - We\'re onto it.', status: 400}};
		}
		const user = this;
		
		try {
			const resStatus = await request(`https://users.roblox.com/users/users/${user.id}`);
			if (resStatus) {
				const jsonStatus = await resStatus.json();
				user.blurb = jsonStatus.description;
				user.joinDate = new Date(jsonStatus.created);
			}else{
				return {error: {message: "The user id is invalid.", status: 404}}
			}
		}catch (error) {
			return {error: {message: 'Something happened that should not have happened.', status: 500, robloxId: user.id, userName: user.username}};
			throw new Error(error);
		}

		//user status
		try {
			const resStatus = await request(`https://users.roblox.com/v1/users/${user.id}/status`);
			if (resStatus) {
				const jsonStatus = await resStatus.json();
				user.status = jsonStatus.status;
			}else{
				return {error: {message: "Invalid user", status: 400}}
			}
		}catch (error) {
			return {error: {message: 'Something happened that should not have happened.', status: 500, robloxId: user.id, userName: user.username}};
			throw new Error(error);
		}
		
		const currentTime = new Date();
		user.age = Math.round(Math.abs((user.joinDate.getTime() - currentTime.getTime()) / (24 * 60 * 60 * 1000)));
		
		const obj = {
			username: user.username,
			status: user.status,
			blurb: user.blurb,
			joinDate: user.joinDate,
			age: user.age
		};
		return obj;
	}
}

module.exports = User;

// Froast's (sentanos') time function. I don't want to re-make something similar. Repo: https://github.com/sentanos/roblox-js/
function isDST (time) {
	const today = new Date(time);
	const month = today.getMonth();
	const dow = today.getDay();
	const day = today.getDate();
	const hours = today.getHours();
	if (month < 2 || month > 10) {
		return false;
	}
	if (month > 2 && month < 10) {
		return true;
	}
	if (dow === 0) {
		if (month === 2) {
			if (day >= 8 && day <= 14) {
				return hours >= 2;
			}
		} else if (month === 10) {
			if (day >= 1 && day <= 7) {
				return hours < 2;
			}
		}
	}
	const previousSunday = day - dow;
	if (month === 2) {
		return previousSunday >= 8;
	}
	return previousSunday <= 0;
}
