module.exports = {
  name: 'Blacklist',
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
};
