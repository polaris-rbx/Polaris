module.exports = {
  name: 'User',
  columns: {
    discord_id: {
      primary: true,
      type: 'varchar',
      length: 50
    },
    roblox_id: {
      type: 'int',
      length: 40
    }
  }
};
