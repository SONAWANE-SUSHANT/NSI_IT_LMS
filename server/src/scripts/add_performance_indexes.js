const sequelize = require("../config/database");

async function addIndexes() {
  try {
    await sequelize.authenticate();
    console.log("Adding performance indexes to MySQL database...");

    const indexes = [
      {
        table: "courses",
        name: "idx_courses_status",
        sql: "CREATE INDEX idx_courses_status ON courses (status);",
      },
      {
        table: "courses",
        name: "idx_courses_created_at",
        sql: "CREATE INDEX idx_courses_created_at ON courses (created_at DESC);",
      },
      {
        table: "users",
        name: "idx_users_role_status",
        sql: "CREATE INDEX idx_users_role_status ON users (role_id, status);",
      },
      {
        table: "users",
        name: "idx_users_created_at",
        sql: "CREATE INDEX idx_users_created_at ON users (created_at DESC);",
      },
      {
        table: "batches",
        name: "idx_batches_course_status",
        sql: "CREATE INDEX idx_batches_course_status ON batches (course_id, status);",
      },
      {
        table: "batches",
        name: "idx_batches_start_date",
        sql: "CREATE INDEX idx_batches_start_date ON batches (start_date);",
      },
      {
        table: "course_modules",
        name: "idx_modules_course_order",
        sql: "CREATE INDEX idx_modules_course_order ON course_modules (course_id, display_order);",
      },
      {
        table: "sessions",
        name: "idx_sessions_module_order",
        sql: "CREATE INDEX idx_sessions_module_order ON sessions (module_id, display_order);",
      },
      {
        table: "sessions",
        name: "idx_sessions_status",
        sql: "CREATE INDEX idx_sessions_status ON sessions (status);",
      },
      {
        table: "session_notes",
        name: "idx_notes_session_order",
        sql: "CREATE INDEX idx_notes_session_order ON session_notes (session_id, display_order);",
      },
      {
        table: "quizzes",
        name: "idx_quizzes_session_status",
        sql: "CREATE INDEX idx_quizzes_session_status ON quizzes (session_id, status);",
      },
      {
        table: "batch_students",
        name: "idx_batch_students_status",
        sql: "CREATE INDEX idx_batch_students_status ON batch_students (status);",
      },
    ];

    for (const idx of indexes) {
      try {
        await sequelize.query(idx.sql);
        console.log(`✓ Added index ${idx.name} on ${idx.table}`);
      } catch (err) {
        if (err.parent && (err.parent.errno === 1061 || err.message.includes("Duplicate key name"))) {
          console.log(`- Index ${idx.name} already exists on ${idx.table}`);
        } else {
          console.error(`Failed to add index ${idx.name}:`, err.message);
        }
      }
    }

    console.log("Indexes creation finished.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to connect or create indexes:", error);
    process.exit(1);
  }
}

addIndexes();
