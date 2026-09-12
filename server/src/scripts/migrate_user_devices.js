const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

async function runMigration() {
  try {
    const sqlPath = path.resolve(__dirname, '../../../database/migrations/016_user_devices.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration 016_user_devices.sql...');
    await sequelize.query(sql);
    console.log('Successfully created user_devices table!');

    const [cols] = await sequelize.query('DESCRIBE user_devices');
    console.log('Columns in user_devices:', cols.map(c => c.Field));
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('user_devices table already exists.');
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
