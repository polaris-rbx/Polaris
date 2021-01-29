const request = require("../request");
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
    }
    await this.updateUsername();
    return this.username;
  }

  // RETURNS: USERNAME OR NULL FOR FAIL.
  async updateUsername () {
    const user = this;
    let res = await request(`https://users.roblox.com/v1/users/${this.id}`);
    res = await res.json();
    user.username = res.Username;
    user.id = res.id || user.id;
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
    }
    return this.updateInfo();
  }

  async updateInfo () {
    if (!this.id) {
      return {
        error: {
          message: "Id is not defined. Please try again - We're onto it.",
          status: 400
        }
      };
    }
    const user = this;

    try {
      const resStatus = await request(`https://users.roblox.com/v1/users/${user.id}`);
      if (resStatus) {
        const jsonStatus = await resStatus.json();
        user.blurb = jsonStatus.description;
        user.joinDate = new Date(jsonStatus.created);
      } else {
        return {
          error: {
            message: "The user id is invalid.",
            status: 404
          }
        };
      }
    } catch (error) {
      return {
        error: {
          message: error.message,
          status: 500,
          robloxId: user.id,
          userName: user.username
        }
      };
      throw new Error(error);
    }

    // user status
    try {
      const resStatus = await request(`https://users.roblox.com/v1/users/${user.id}/status`);
      if (resStatus) {
        const jsonStatus = await resStatus.json();
        user.status = jsonStatus.status;
      } else {
        return {
          error: {
            message: "Invalid user",
            status: 400
          }
        };
      }
    } catch (error) {
      return {
        error: {
          message: error.message,
          status: 500,
          robloxId: user.id,
          userName: user.username
        }
      };
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
