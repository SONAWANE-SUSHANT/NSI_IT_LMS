const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

async function runMigration() {
  try {
    const spPath = path.resolve(__dirname, '../../../database/migrations/017_session_progress.sql');
    const spSql = fs.readFileSync(spPath, 'utf8');
    console.log('Running migration 017_session_progress.sql...');
    await sequelize.query(spSql);
    console.log('Successfully created session_progress table!');

    const cpPath = path.resolve(__dirname, '../../../database/migrations/019_course_progress.sql');
    const cpSql = fs.readFileSync(cpPath, 'utf8');
    console.log('Running migration 019_course_progress.sql...');
    await sequelize.query(cpSql);
    console.log('Successfully created course_progress table!');

    const [spCols] = await sequelize.query('DESCRIBE session_progress');
    console.log('Columns in session_progress:', spCols.map(c => c.Field));

    const [cpCols] = await sequelize.query('DESCRIBE course_progress');
    console.log('Columns in course_progress:', cpCols.map(c => c.Field));

    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Tables already exist:', error.message);
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
