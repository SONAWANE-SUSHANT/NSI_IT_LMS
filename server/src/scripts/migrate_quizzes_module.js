const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('--- Starting Quizzes Course/Module Migration ---');
    const [cols] = await sequelize.query('DESCRIBE quizzes');
    const hasModuleId = cols.some((c) => c.Field === 'module_id');
    const hasCourseId = cols.some((c) => c.Field === 'course_id');

    if (!hasModuleId) {
      await sequelize.query('ALTER TABLE quizzes ADD COLUMN module_id INT UNSIGNED NULL AFTER session_id');
      console.log('Added module_id column to quizzes');
    }
    if (!hasCourseId) {
      await sequelize.query('ALTER TABLE quizzes ADD COLUMN course_id INT UNSIGNED NULL AFTER module_id');
      console.log('Added course_id column to quizzes');
    }

    await sequelize.query('ALTER TABLE quizzes MODIFY COLUMN session_id INT UNSIGNED NULL');
    console.log('Modified session_id to allow NULL');

    // Backfill module_id and course_id for existing quizzes from session
    await sequelize.query(`
      UPDATE quizzes q
      JOIN sessions s ON q.session_id = s.id
      JOIN course_modules m ON s.module_id = m.id
      SET q.module_id = s.module_id, q.course_id = m.course_id
      WHERE q.module_id IS NULL AND q.session_id IS NOT NULL
    `);
    console.log('Backfilled existing quizzes with module_id and course_id');

    const [rows] = await sequelize.query('SELECT id, title, session_id, module_id, course_id, status FROM quizzes');
    console.log('Migrated Quizzes:', rows);
    console.log('--- Migration Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
