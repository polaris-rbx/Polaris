const { EntitySchema } = require('typeorm');
const { Group } = require('../model/Group')

module.exports = new EntitySchema({
    name: 'Group',
    tableName: 'groups',
    target: Group,
    columns: {
        id: {
            primary: true,
            type: 'int'
        },
        main: {
            type: 'boolean',
            default: 'true'
        },
        binds: {
            type: 'jsonb',
            array: true
        },
        ranks_to_roles: {
            type: 'boolean',
            default: 'false'
        }
    },

    relations: {
        server: {
            target: 'Server',
            eager: true,
            type: 'many-to-one',
            joinColumn: { name: 'server_id' }
        }
    }
});
