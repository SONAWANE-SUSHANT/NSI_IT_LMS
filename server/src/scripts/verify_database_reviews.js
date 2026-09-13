require("dotenv").config();
const sequelize = require("../config/database");

async function verify() {
  try {
    console.log("==========================================");
    console.log("DATABASE VERIFICATION: course_reviews");
    console.log("==========================================");

    console.log("\n--- 1. DESCRIBE course_reviews ---");
    const [cols] = await sequelize.query("DESCRIBE course_reviews");
    console.table(cols);

    console.log("\n--- 2. SAMPLE DATA ---");
    const [rows] = await sequelize.query(
      "SELECT id, course_id, student_id, rating, review, status, created_at, updated_at FROM course_reviews ORDER BY id DESC LIMIT 10"
    );
    console.table(rows);

    console.log("\n--- 3. CONSTRAINT CHECKS ---");
    const [dupCheck] = await sequelize.query(
      "SELECT course_id, student_id, COUNT(*) as cnt FROM course_reviews GROUP BY course_id, student_id HAVING cnt > 1"
    );
    console.log("Duplicates count (should be 0):", dupCheck.length);

    const [ratingCheck] = await sequelize.query(
      "SELECT COUNT(*) as invalid_ratings FROM course_reviews WHERE rating < 1 OR rating > 5"
    );
    console.log("Invalid ratings count (should be 0):", ratingCheck[0].invalid_ratings);

    const [statusCheck] = await sequelize.query(
      "SELECT COUNT(*) as invalid_status FROM course_reviews WHERE status NOT IN ('ACTIVE', 'HIDDEN')"
    );
    console.log("Invalid status count (should be 0):", statusCheck[0].invalid_status);

    console.log("\n✔ DATABASE VERIFICATION SUCCESSFUL!");
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await sequelize.close();
  }
}

verify();
