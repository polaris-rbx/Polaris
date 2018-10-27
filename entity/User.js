const { EntitySchema } = require('typeorm');
const { User } = require('../model/User')

module.exports = new EntitySchema({
    name: 'User',
    target: User,
    columns: {
        discord_id: {
            primary: true,
            type: 'varchar',
            length: 50
        },
        roblox_id: {
            type: 'int'
        }
    }
});
