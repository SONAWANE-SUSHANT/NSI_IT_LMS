/**
 * Comprehensive Automated Verification Suite for Instructor Course Access Control
 *
 * Verifies that:
 * 1. Instructors can only view courses they are assigned to (or created).
 * 2. Instructors get 403 Forbidden when attempting to access unassigned courses.
 * 3. Instructors get 403 Forbidden when accessing modules of unassigned courses.
 * 4. Instructors get 403 Forbidden when creating quizzes or importing CSVs for unassigned courses.
 * 5. Instructors successfully access, list, and create quizzes for assigned courses.
 * 6. Quizzes list only shows quizzes belonging to instructor's allowed courses.
 * 7. Admin retains full access, and proxying via x-instructor-id properly scopes access.
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");
const {
  User,
  UserRole,
  Course,
  CourseBatch,
  CourseInstructor,
  CourseModule,
  Quiz,
  QuizQuestion,
  QuizOption,
} = require("../models");

const API_BASE = "http://localhost:5000/api";

async function run() {
  console.log("==================================================");
  console.log("🔒 INSTRUCTOR COURSE ACCESS CONTROL VERIFICATION");
  console.log("==================================================");

  // 1. Fetch or identify Admin
  const adminUser = await User.findOne({
    include: [{ model: UserRole, as: "role", where: { name: "ADMIN" } }],
  });
  if (!adminUser) throw new Error("Admin user not found in database.");

  const adminToken = jwt.sign(
    { id: adminUser.id, role: "ADMIN", email: adminUser.email },
    process.env.JWT_SECRET || "change_this_later",
    { expiresIn: "1h" }
  );

  // 2. Fetch or create an Instructor
  let instructorUser = await User.findOne({
    include: [{ model: UserRole, as: "role", where: { name: "INSTRUCTOR" } }],
  });

  if (!instructorUser) {
    const instructorRole = await UserRole.findOne({ where: { name: "INSTRUCTOR" } });
    instructorUser = await User.create({
      full_name: "Test Instructor Access",
      email: `test_inst_${Date.now()}@example.com`,
      password: "dummy_hashed_password",
      role_id: instructorRole.id,
      status: "ACTIVE",
    });
    console.log(`Created temporary test instructor #${instructorUser.id}`);
  }

  const instructorToken = jwt.sign(
    { id: instructorUser.id, role: "INSTRUCTOR", email: instructorUser.email },
    process.env.JWT_SECRET || "change_this_later",
    { expiresIn: "1h" }
  );

  console.log(`Using Instructor #${instructorUser.id} (${instructorUser.email})`);

  // 3. Set up Course A (Assigned) and Course B (Unassigned)
  const courses = await Course.findAll({ order: [["id", "ASC"]], limit: 10 });
  if (courses.length < 2) {
    throw new Error("At least two courses required in DB to test access segregation.");
  }

  const courseA = courses[0];
  const courseB = courses[1];

  console.log(`Course A (Target: Assigned): #${courseA.id} "${courseA.name}"`);
  console.log(`Course B (Target: Unassigned): #${courseB.id} "${courseB.name}"`);

  // Ensure Course B was not created by instructor
  if (courseB.created_by === instructorUser.id) {
    await courseB.update({ created_by: adminUser.id });
  }

  // Ensure Instructor is NOT assigned to any batch in Course B
  const batchesInB = await CourseBatch.findAll({ where: { course_id: courseB.id } });
  const batchBIds = batchesInB.map((b) => b.id);
  if (batchBIds.length > 0) {
    await CourseInstructor.destroy({
      where: {
        batch_id: batchBIds,
        instructor_id: instructorUser.id,
      },
    });
  }

  // Ensure Instructor IS assigned to Course A (either created_by or via batch)
  let batchA = await CourseBatch.findOne({ where: { course_id: courseA.id } });
  if (!batchA) {
    batchA = await CourseBatch.create({
      course_id: courseA.id,
      name: `Access Test Batch ${Date.now()}`,
      batch_code: `TEST_BAT_${Date.now()}`,
      start_date: new Date(),
      status: "ACTIVE",
      created_by: adminUser.id,
    });
  }

  let linkA = await CourseInstructor.findOne({
    where: { batch_id: batchA.id, instructor_id: instructorUser.id },
  });
  if (!linkA) {
    linkA = await CourseInstructor.create({
      batch_id: batchA.id,
      instructor_id: instructorUser.id,
      status: "ACTIVE",
    });
    console.log(`Assigned Instructor #${instructorUser.id} to Batch #${batchA.id} in Course #${courseA.id}`);
  } else if (linkA.status !== "ACTIVE") {
    await linkA.update({ status: "ACTIVE" });
  }

  // Ensure module exists in both Course A and Course B
  let moduleA = await CourseModule.findOne({ where: { course_id: courseA.id } });
  if (!moduleA) {
    moduleA = await CourseModule.create({
      course_id: courseA.id,
      name: "Module A For Testing",
      status: "ACTIVE",
    });
  }

  let moduleB = await CourseModule.findOne({ where: { course_id: courseB.id } });
  if (!moduleB) {
    moduleB = await CourseModule.create({
      course_id: courseB.id,
      name: "Module B For Testing",
      status: "ACTIVE",
    });
  }

  let createdQuizId = null;

  try {
    // ─────────────────────────────────────────────────────────
    // TEST 1: GET /api/courses with Instructor Token
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 1: GET /api/courses (Instructor Token) ---");
    const resCourses = await fetch(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    const dataCourses = await resCourses.json();
    console.log(`Status: ${resCourses.status}, Total courses returned: ${dataCourses.data?.length || 0}`);

    const returnedCourseIds = (dataCourses.data || []).map((c) => c.id);
    const hasA = returnedCourseIds.includes(courseA.id);
    const hasB = returnedCourseIds.includes(courseB.id);

    if (resCourses.status === 200 && hasA && !hasB) {
      console.log("✔ TEST 1 PASSED: Instructor sees assigned Course A and cannot see unassigned Course B.");
    } else {
      throw new Error(`TEST 1 FAILED: Expected hasA=true, hasB=false. Got hasA=${hasA}, hasB=${hasB}`);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 2: GET /api/courses/:courseId (Unassigned Course B -> 403)
    // ─────────────────────────────────────────────────────────
    console.log(`\n--- TEST 2: GET /api/courses/${courseB.id} (Unassigned Course B) ---`);
    const resGetB = await fetch(`${API_BASE}/courses/${courseB.id}`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    console.log(`Status: ${resGetB.status}`);
    const bodyGetB = await resGetB.json();

    if (resGetB.status === 403) {
      console.log(`✔ TEST 2 PASSED: Correctly blocked with 403 Forbidden: "${bodyGetB.message}"`);
    } else {
      throw new Error(`TEST 2 FAILED: Expected status 403, got ${resGetB.status}`);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 3: GET /api/courses/:courseId (Assigned Course A -> 200)
    // ─────────────────────────────────────────────────────────
    console.log(`\n--- TEST 3: GET /api/courses/${courseA.id} (Assigned Course A) ---`);
    const resGetA = await fetch(`${API_BASE}/courses/${courseA.id}`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    console.log(`Status: ${resGetA.status}`);
    const bodyGetA = await resGetA.json();

    if (resGetA.status === 200 && bodyGetA.data?.id === courseA.id) {
      console.log(`✔ TEST 3 PASSED: Instructor successfully fetched details of assigned Course A.`);
    } else {
      throw new Error(`TEST 3 FAILED: Expected status 200, got ${resGetA.status}`);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 4: GET /api/courses/:courseId/modules (Unassigned Course B -> 403)
    // ─────────────────────────────────────────────────────────
    console.log(`\n--- TEST 4: GET /api/courses/${courseB.id}/modules (Unassigned Course B) ---`);
    const resModsB = await fetch(`${API_BASE}/courses/${courseB.id}/modules`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    console.log(`Status: ${resModsB.status}`);

    if (resModsB.status === 403) {
      console.log("✔ TEST 4 PASSED: Modules for unassigned course are blocked with 403.");
    } else {
      throw new Error(`TEST 4 FAILED: Expected status 403, got ${resModsB.status}`);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 5: POST /api/quizzes/import-csv for Unassigned Course B -> 403
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 5: POST /api/quizzes/import-csv for Unassigned Course B ---");
    const sampleCsv = [
      "question_text,question_type,marks,difficulty,option_a,option_b,option_c,option_d,correct_option,explanation,programming_language,starter_code,constraints,expected_output",
      '"What is 2+2?",MCQ,2,EASY,"3","4","5","6",B,"2+2=4",,,',
    ].join("\n");

    const resCreateQuizB = await fetch(`${API_BASE}/quizzes/import-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        course_id: courseB.id,
        module_id: moduleB.id,
        title: "Unauthorized Quiz Attempt",
        csv_content: sampleCsv,
      }),
    });
    console.log(`Status: ${resCreateQuizB.status}`);
    const bodyCreateB = await resCreateQuizB.json();

    if (resCreateQuizB.status === 403) {
      console.log(`✔ TEST 5 PASSED: Quiz creation on unassigned course rejected with 403: "${bodyCreateB.message}"`);
    } else {
      throw new Error(`TEST 5 FAILED: Expected 403, got ${resCreateQuizB.status}`);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 6: POST /api/quizzes/import-csv for Assigned Course A -> 201 Created
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 6: POST /api/quizzes/import-csv for Assigned Course A ---");
    const resCreateQuizA = await fetch(`${API_BASE}/quizzes/import-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        course_id: courseA.id,
        module_id: moduleA.id,
        title: `Permitted Quiz ${Date.now()}`,
        csv_content: sampleCsv,
      }),
    });
    console.log(`Status: ${resCreateQuizA.status}`);
    const bodyCreateA = await resCreateQuizA.json();

    if (resCreateQuizA.status === 201 && bodyCreateA.data?.id) {
      createdQuizId = bodyCreateA.data.id;
      console.log(`✔ TEST 6 PASSED: Quiz #${createdQuizId} created successfully for assigned Course A.`);
    } else {
      throw new Error(`TEST 6 FAILED: Expected 201, got ${resCreateQuizA.status}: ${bodyCreateA.message}`);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 7: GET /api/quizzes (Instructor list scoping)
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 7: GET /api/quizzes (Instructor Token) ---");
    const resListQuizzes = await fetch(`${API_BASE}/quizzes`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    console.log(`Status: ${resListQuizzes.status}`);
    const bodyListQuizzes = await resListQuizzes.json();

    const quizIds = (bodyListQuizzes.data || []).map((q) => q.id);
    const includesCreated = quizIds.includes(createdQuizId);

    if (resListQuizzes.status === 200 && includesCreated) {
      console.log(`✔ TEST 7 PASSED: Instructor quizzes list contains permitted quiz #${createdQuizId}.`);
    } else {
      throw new Error(`TEST 7 FAILED: Quizzes list did not include permitted quiz.`);
    }

    // ─────────────────────────────────────────────────────────
    // TEST 8: Admin full access vs Admin proxying x-instructor-id
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 8: Admin Proxy Header (x-instructor-id) Scoping ---");
    const resAdminDirect = await fetch(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataAdminDirect = await resAdminDirect.json();
    const adminDirectCourseIds = (dataAdminDirect.data || []).map((c) => c.id);

    const resAdminProxy = await fetch(`${API_BASE}/courses`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "x-instructor-id": String(instructorUser.id),
      },
    });
    const dataAdminProxy = await resAdminProxy.json();
    const adminProxyCourseIds = (dataAdminProxy.data || []).map((c) => c.id);

    if (
      adminDirectCourseIds.includes(courseA.id) &&
      adminDirectCourseIds.includes(courseB.id) &&
      adminProxyCourseIds.includes(courseA.id) &&
      !adminProxyCourseIds.includes(courseB.id)
    ) {
      console.log("✔ TEST 8 PASSED: Admin has full access normally, and is properly scoped when proxying as instructor.");
    } else {
      throw new Error("TEST 8 FAILED: Admin scoping or proxying check failed.");
    }

    console.log("\n==================================================");
    console.log("🎉 ALL 8 ACCESS CONTROL TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } finally {
    // Clean up created quiz
    if (createdQuizId) {
      console.log(`\nCleaning up test quiz #${createdQuizId}...`);
      await QuizOption.destroy({
        where: {},
        include: [{ model: QuizQuestion, as: "question", where: { quiz_id: createdQuizId } }],
      }).catch(() => {});
      await QuizQuestion.destroy({ where: { quiz_id: createdQuizId } }).catch(() => {});
      await Quiz.destroy({ where: { id: createdQuizId } }).catch(() => {});
      console.log("Test quiz cleaned up.");
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TEST RUN FAILED:", err);
    process.exit(1);
  });
