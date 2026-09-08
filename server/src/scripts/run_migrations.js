const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");

const runMigrationsAndSeed = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL database.");

    // 1. Disable FK checks and drop tables
    console.log("Dropping existing tables if any...");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");

    const tablesToDrop = [
      "quiz_options",
      "quiz_questions",
      "quizzes",
      "session_notes",
      "sessions",
      "lecture_notes",
      "lectures",
      "course_modules",
      "batch_students",
      "course_students",
      "batch_instructors",
      "course_instructors",
      "batches",
      "course_batches",
      "courses",
      "course_categories",
      "users",
      "users_roles",
      "user_roles",
    ];

    for (const table of tablesToDrop) {
      await sequelize.query(`DROP TABLE IF EXISTS ${table};`);
    }

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("Old tables dropped successfully.");

    // 2. Execute migration files in order
    const migrationsDir = path.resolve(__dirname, "../../../database/migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files in ${migrationsDir}:`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");
      
      // Execute the SQL statements
      await sequelize.query(sql);
      console.log(`Completed migration: ${file}`);
    }

    // 3. Seed user_roles
    console.log("Seeding user roles...");
    await sequelize.query(`
      INSERT INTO user_roles (id, name, created_by, updated_by)
      VALUES 
        (1, 'ADMIN', 1, 1),
        (2, 'INSTRUCTOR', 1, 1),
        (3, 'STUDENT', 1, 1)
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // 4. Seed initial default users
    console.log("Seeding initial users (admin, instructor, student)...");
    const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
    const instructorPasswordHash = await bcrypt.hash("Instructor@123", 10);
    const studentPasswordHash = await bcrypt.hash("Student@123", 10);

    // Insert Admin
    await sequelize.query(`
      INSERT INTO users (first_name, last_name, email, password, role_id, status, contact_no, gender)
      VALUES ('Admin', 'Administrator', 'admin@nsiit.com', '${adminPasswordHash}', 1, 'ACTIVE', '9999999999', 'OTHER');
    `);

    // Insert Instructor
    await sequelize.query(`
      INSERT INTO users (first_name, last_name, email, password, role_id, status, contact_no, gender, created_by, updated_by)
      VALUES ('Instructor', 'Faculty', 'instructor@nsiit.com', '${instructorPasswordHash}', 2, 'ACTIVE', '9888888888', 'MALE', 1, 1);
    `);

    // Insert Student
    await sequelize.query(`
      INSERT INTO users (first_name, last_name, email, password, role_id, status, contact_no, gender, created_by, updated_by)
      VALUES ('Student', 'Learner', 'student@nsiit.com', '${studentPasswordHash}', 3, 'ACTIVE', '9777777777', 'FEMALE', 1, 1);
    `);

    console.log("\n==========================================");
    console.log(" MIGRATION AND SEEDING COMPLETED SUCCESS!");
    console.log("==========================================");

    // Verify all created tables
    const [tables] = await sequelize.query("SHOW TABLES;");
    console.log("New database tables:", tables.map((t) => Object.values(t)[0]));

    // Verify seeded users
    const [users] = await sequelize.query("SELECT id, first_name, last_name, email, username, role_id, contact_no, gender, status FROM users;");
    console.log("\nSeeded users:", users);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigrationsAndSeed();
