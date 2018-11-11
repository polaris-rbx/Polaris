const { EntitySchema } = require('typeorm');
const { Server } = require('../model/Server')

module.exports = new EntitySchema({
    name: 'Server',
    tableName: 'servers',
    target: Server,
    columns: {
        id: {
            primary: true,
            type: 'varchar',
            length: 50
        },
        autoverify: {
            type: 'boolean',
            default: 'false'
        },
        nickname_template: {
            type: 'varchar',
            length: 50,
            nullable: true
        },
        prefix: {
            type: 'varchar',
            length: 2,
            default: '.'
        }
    },

    relations: {
        groups: {
            target: 'Group',
            eager: true,
            type: 'one-to-many'
        }
    }
});
