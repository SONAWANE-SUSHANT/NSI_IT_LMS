const sequelize = require('../config/database');

async function migrateUsername() {
  try {
    console.log('Altering users username formula in MySQL...');
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN username VARCHAR(100) GENERATED ALWAYS AS (
        CONCAT(LOWER(REPLACE(first_name, ' ', '')), '.', LOWER(REPLACE(last_name, ' ', '')), '@nsi')
      ) STORED;
    `);
    console.log('Username formula successfully altered in MySQL.');

    const [rows] = await sequelize.query('SELECT id, first_name, last_name, username FROM users LIMIT 5;');
    console.log('Sample updated user usernames:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateUsername();
