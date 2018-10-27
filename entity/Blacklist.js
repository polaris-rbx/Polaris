const { EntitySchema } = require('typeorm');
const { Blacklist } = require('../model/Blacklist')

module.exports = new EntitySchema({
    name: 'Blacklist',
    target: Blacklist,
    columns: {
        id: {
            primary: true,
            type: 'varchar',
            length: 50
        },
        set_at: {
            type: 'timestamptz'
        },
        reason: {
            type: 'varchar',
            length: 100
        },
        set_by: {
            type: 'varchar',
            length: 50
        }
    }
});
