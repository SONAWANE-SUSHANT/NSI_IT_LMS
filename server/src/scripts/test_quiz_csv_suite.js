/**
 * Automated Verification Suite for CSV Quiz/Test Creation and Import
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { User, CourseModule, Course, Quiz, QuizQuestion, QuizOption } = require("../models");

const API_BASE = "http://localhost:5000/api";

const run = async () => {
  console.log("==================================================");
  console.log("🧪 TESTING QUIZ CREATION BY CSV UPLOAD SUITE");
  console.log("==================================================");

  // 1. Authenticate as Admin/Instructor
  const adminUser = await User.findOne({ where: { role_id: 1 } });
  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  const token = jwt.sign(
    { id: adminUser.id, role: "ADMIN", email: adminUser.email },
    process.env.JWT_SECRET || "change_this_later",
    { expiresIn: "1h" }
  );

  // 2. Find a valid Course and Module
  const moduleRecord = await CourseModule.findOne({
    include: [{ model: Course, as: "course" }],
  });

  if (!moduleRecord) {
    throw new Error("No course module found in DB to attach quiz to.");
  }

  console.log(`Using Course #${moduleRecord.course_id}, Module #${moduleRecord.id} ("${moduleRecord.name}")`);

  let createdQuizId = null;

  try {
    // 3. Test Sample CSV Download Endpoint
    console.log("\n--- TEST 1: GET /api/quizzes/sample-csv ---");
    const sampleRes = await fetch(`${API_BASE}/quizzes/sample-csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Status:", sampleRes.status);
    const sampleText = await sampleRes.text();
    if (sampleRes.status === 200 && sampleText.includes("question_text") && sampleText.includes("MCQ")) {
      console.log("✔ TEST 1 PASSED: Sample CSV template served successfully.");
    } else {
      throw new Error(`Sample CSV endpoint failed with status ${sampleRes.status}`);
    }

    // 4. Test Creating Quiz via CSV Upload (POST /api/quizzes/import-csv)
    console.log("\n--- TEST 2: POST /api/quizzes/import-csv (Valid CSV) ---");
    const testCsv = [
      'question_text,question_type,marks,difficulty,option_a,option_b,option_c,option_d,correct_option,explanation,programming_language,starter_code,constraints,expected_output',
      '"What is 10 + 20 in decimal?",MCQ,5,EASY,"20","30","40","50",B,"10 + 20 equals 30",,,',
      '"Which planet is known as the Red Planet?",MCQ,5,EASY,"Venus","Mars","Jupiter","Saturn",B,"Mars is the Red Planet",,,',
      '"Write Python code to print Hello World",CODING,10,MEDIUM,,,,,,,"python","print(\'Hello World\')","None","Hello World"',
    ].join("\n");

    const createRes = await fetch(`${API_BASE}/quizzes/import-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        course_id: moduleRecord.course_id,
        module_id: moduleRecord.id,
        title: "Automated CSV Test Assessment",
        description: "Created via automated test suite",
        instructions: "Complete all questions",
        duration_minutes: 45,
        passing_marks: 10,
        max_attempts: 2,
        csv_content: testCsv,
      }),
    });

    const createJson = await createRes.json();
    console.log("Status:", createRes.status, "Message:", createJson.message);

    if (createRes.status !== 201 || !createJson.data?.id) {
      throw new Error(`Create quiz from CSV failed: ${JSON.stringify(createJson)}`);
    }

    createdQuizId = createJson.data.id;
    console.log(`Created Quiz #${createdQuizId} with Total Marks: ${createJson.data.total_marks}`);

    // Verify questions and options
    const activeQuestions = createJson.data.questions || [];
    if (activeQuestions.length !== 3) {
      throw new Error(`Expected 3 questions, got ${activeQuestions.length}`);
    }

    const mcq1 = activeQuestions.find((q) => q.question_type === "MCQ");
    if (!mcq1 || !mcq1.options || mcq1.options.length !== 4) {
      throw new Error("MCQ options not properly created");
    }

    const correctOption = mcq1.options.find((o) => o.is_correct);
    if (!correctOption || correctOption.option_label !== "B") {
      throw new Error(`Expected correct option to be B, got ${correctOption?.option_label}`);
    }

    const codingQ = activeQuestions.find((q) => q.question_type === "CODING");
    if (!codingQ || codingQ.programming_language !== "python" || codingQ.expected_output !== "Hello World") {
      throw new Error("Coding question attributes not properly saved");
    }

    if (Number(createJson.data.total_marks) !== 20) {
      throw new Error(`Expected total marks 20 (5+5+10), got ${createJson.data.total_marks}`);
    }

    console.log("✔ TEST 2 PASSED: Quiz and questions successfully created in database with accurate options and marks.");

    // 5. Test Appending Questions via CSV to Existing Quiz (POST /api/quizzes/:quizId/import-csv)
    console.log(`\n--- TEST 3: POST /api/quizzes/${createdQuizId}/import-csv (Append Questions) ---`);
    const appendCsv = [
      'question_text,question_type,marks,difficulty,option_a,option_b,option_c,option_d,correct_option,explanation',
      '"What is the boiling point of water at sea level?",MCQ,5,EASY,"90C","100C","110C","120C",B,"Water boils at 100C"',
    ].join("\n");

    const appendRes = await fetch(`${API_BASE}/quizzes/${createdQuizId}/import-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        csv_content: appendCsv,
      }),
    });

    const appendJson = await appendRes.json();
    console.log("Status:", appendRes.status, "Message:", appendJson.message);

    if (appendRes.status !== 200) {
      throw new Error(`Append questions failed: ${JSON.stringify(appendJson)}`);
    }

    const updatedQuestions = appendJson.data.questions || [];
    if (updatedQuestions.length !== 4) {
      throw new Error(`Expected 4 questions after append, got ${updatedQuestions.length}`);
    }

    if (Number(appendJson.data.total_marks) !== 25) {
      throw new Error(`Expected total marks 25 after append, got ${appendJson.data.total_marks}`);
    }

    console.log("✔ TEST 3 PASSED: Additional questions appended to existing quiz successfully.");

    // 6. Test Error Handling on Malformed CSV
    console.log("\n--- TEST 4: Error Handling on Malformed CSV ---");
    const malformedCsv = [
      'question_text,question_type,option_a,correct_option',
      '"MCQ with missing option_b",MCQ,"Only Option A",A',
    ].join("\n");

    const errorRes = await fetch(`${API_BASE}/quizzes/import-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        course_id: moduleRecord.course_id,
        module_id: moduleRecord.id,
        title: "Malformed CSV Test",
        csv_content: malformedCsv,
      }),
    });

    const errorJson = await errorRes.json();
    console.log("Status:", errorRes.status, "Error message:", errorJson.message);

    if (errorRes.status === 400 && errorJson.message.includes("must have at least 2 options")) {
      console.log("✔ TEST 4 PASSED: Malformed CSV rejected with meaningful error validation.");
    } else {
      throw new Error(`Expected 400 validation error, got status ${errorRes.status}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL CSV QUIZ TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } finally {
    // Cleanup created test quiz
    if (createdQuizId) {
      console.log(`\n🧹 Cleaning up test quiz #${createdQuizId}...`);
      await QuizOption.destroy({
        where: {},
        include: [{ model: QuizQuestion, as: "question", where: { quiz_id: createdQuizId } }],
      }).catch(() => {});
      await QuizQuestion.destroy({ where: { quiz_id: createdQuizId } }).catch(() => {});
      await Quiz.destroy({ where: { id: createdQuizId } }).catch(() => {});
      console.log("✔ Clean up complete.");
    }
  }

  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
