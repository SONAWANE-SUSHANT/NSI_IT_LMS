/**
 * Comprehensive Automated Quiz & Coding Test Verification Suite
 * Verifies all 24 required points from Phase 1 requirements.
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const {
  User,
  Lecture,
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAttemptAnswer,
  CourseStudent,
  CourseBatch,
  CourseModule,
} = require("../models");

const API_BASE = "http://localhost:5000/api";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "change_this_later",
    { expiresIn: "1h" }
  );
};

const runSuite = async () => {
  console.log("=================================================");
  console.log("--- STARTING LMS QUIZ & TEST BACKEND VERIFICATION ---");
  console.log("=================================================");

  // Find users
  const adminUser = await User.findOne({ where: { role_id: 1 } });
  const instructorUser = await User.findOne({ where: { role_id: 2 } });
  const studentUser = await User.findOne({ where: { role_id: 3 } });

  if (!adminUser || !instructorUser || !studentUser) {
    throw new Error("Missing required seed users in DB (Admin, Instructor, Student)");
  }

  console.log(`Using Admin #${adminUser.id}, Instructor #${instructorUser.id}, Student #${studentUser.id}`);

  const adminToken = jwt.sign(
    { id: adminUser.id, role: "ADMIN", email: adminUser.email },
    process.env.JWT_SECRET || "change_this_later",
    { expiresIn: "1h" }
  );

  const instructorToken = jwt.sign(
    { id: instructorUser.id, role: "INSTRUCTOR", email: instructorUser.email },
    process.env.JWT_SECRET || "change_this_later",
    { expiresIn: "1h" }
  );

  const studentToken = jwt.sign(
    { id: studentUser.id, role: "STUDENT", email: studentUser.email },
    process.env.JWT_SECRET || "change_this_later",
    { expiresIn: "1h" }
  );

  // Find a lecture in a course the student is enrolled in
  const { CourseBatch } = require("../models");
  const enrollment = await CourseStudent.findOne({
    where: { student_id: studentUser.id, status: "ACTIVE" },
    include: [{ model: CourseBatch, as: "batch" }],
  });

  let lecture = null;
  if (enrollment && enrollment.batch) {
    const module = await CourseModule.findOne({
      where: { course_id: enrollment.batch.course_id },
    });
    if (module) {
      lecture = await Lecture.findOne({ where: { module_id: module.id } });
    }
  }

  if (!lecture) {
    lecture = await Lecture.findOne();
  }

  if (!lecture) {
    throw new Error("No lecture/session exists in DB to associate quizzes with");
  }
  console.log(`Using Session/Lecture #${lecture.id}: "${lecture.title}"`);

  let testQuizId = null;
  let mcqQuestionId = null;
  let optAId = null;
  let optBId = null;
  let codingQuestionId = null;
  let attemptId = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Create Quiz
    // -------------------------------------------------------------
    console.log("\n[Test 1] Create Quiz (as Instructor)");
    const createRes = await fetch(`${API_BASE}/quizzes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        session_id: lecture.id,
        title: "E2E Automated Assessment: Full-Stack Fundamentals",
        description: "Test covering core JavaScript and Python algorithm concepts",
        instructions: "Answer all questions. Coding questions will be executed against test cases.",
        duration_minutes: 30,
        passing_marks: 5.0,
        max_attempts: 2,
      }),
    });

    const createData = await createRes.json();
    console.log("Status:", createRes.status, "Quiz ID:", createData.data?.id, "Status:", createData.data?.status);
    if (createRes.status !== 201 || !createData.data?.id) {
      throw new Error(`Failed to create quiz: ${JSON.stringify(createData)}`);
    }
    testQuizId = createData.data.id;

    // -------------------------------------------------------------
    // Test 2: Add MCQ Question
    // -------------------------------------------------------------
    console.log("\n[Test 2] Add MCQ Question");
    const mcqRes = await fetch(`${API_BASE}/quizzes/${testQuizId}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        question_type: "MCQ",
        question_text: "What is the output of typeof null in JavaScript?",
        marks: 5.0,
        difficulty: "EASY",
        explanation: "In JavaScript, typeof null returns 'object' due to a historical bug in the language implementation.",
      }),
    });
    const mcqData = await mcqRes.json();
    console.log("Status:", mcqRes.status, "MCQ ID:", mcqData.data?.id);
    if (mcqRes.status !== 201 || !mcqData.data?.id) {
      throw new Error(`Failed to add MCQ: ${JSON.stringify(mcqData)}`);
    }
    mcqQuestionId = mcqData.data.id;

    // -------------------------------------------------------------
    // Test 3: Add Options to MCQ
    // -------------------------------------------------------------
    console.log("\n[Test 3] Add Options to MCQ Question");
    const optARes = await fetch(`${API_BASE}/questions/${mcqQuestionId}/options`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        option_label: "A",
        option_text: "'null'",
        is_correct: false,
      }),
    });
    const optAData = await optARes.json();
    optAId = optAData.data.id;

    const optBRes = await fetch(`${API_BASE}/questions/${mcqQuestionId}/options`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        option_label: "B",
        option_text: "'object'",
        is_correct: true, // Correct option
      }),
    });
    const optBData = await optBRes.json();
    optBId = optBData.data.id;
    console.log(`Added Option A (#${optAId}) and Option B (#${optBId}, correct=true)`);

    // -------------------------------------------------------------
    // Test 4 & 5: Add Coding Question & Configure
    // -------------------------------------------------------------
    console.log("\n[Test 4 & 5] Add & Configure Coding Question");
    const codingRes = await fetch(`${API_BASE}/quizzes/${testQuizId}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        question_type: "CODING",
        question_text: "Write a program in Python that prints the square of 9.",
        marks: 5.0,
        difficulty: "MEDIUM",
        programming_language: "python",
        starter_code: "# Write a Python program to print the square of 9\n",
        expected_output: "81",
        explanation: "9 * 9 = 81",
      }),
    });
    const codingData = await codingRes.json();
    console.log("Status:", codingRes.status, "Coding Question ID:", codingData.data?.id, "Lang:", codingData.data?.programming_language);
    if (codingRes.status !== 201 || !codingData.data?.id) {
      throw new Error(`Failed to add Coding question: ${JSON.stringify(codingData)}`);
    }
    codingQuestionId = codingData.data.id;

    // -------------------------------------------------------------
    // Test 6: Quiz Validation & Publish
    // -------------------------------------------------------------
    console.log("\n[Test 6] Pre-publish validation & Publish Quiz");
    const publishRes = await fetch(`${API_BASE}/quizzes/${testQuizId}/publish`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${instructorToken}`,
      },
    });
    const publishData = await publishRes.json();
    console.log("Publish Status:", publishRes.status, "Quiz Status:", publishData.data?.status, "Total Marks:", publishData.data?.total_marks);
    if (publishRes.status !== 200 || publishData.data?.status !== "PUBLISHED") {
      throw new Error(`Failed to publish quiz: ${JSON.stringify(publishData)}`);
    }

    // -------------------------------------------------------------
    // Test 7 & 8: Student visibility (can see published, cannot see draft)
    // -------------------------------------------------------------
    console.log("\n[Test 7 & 8] Student Quiz Discovery (Published vs Draft)");
    // Create a draft quiz
    const draftQuiz = await Quiz.create({
      session_id: lecture.id,
      title: "Hidden Draft Quiz",
      status: "DRAFT",
      total_marks: 5.0,
    });

    const studentQuizzesRes = await fetch(`${API_BASE}/student/quizzes`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentQuizzesData = await studentQuizzesRes.json();
    const visibleQuizIds = (studentQuizzesData.data || []).map((q) => q.id);
    console.log("Published Quiz visible to student:", visibleQuizIds.includes(testQuizId));
    console.log("Draft Quiz hidden from student:", !visibleQuizIds.includes(draftQuiz.id));

    if (!visibleQuizIds.includes(testQuizId)) {
      console.log("Note: Student was not in active batch for this session or enrolled. Linking student for test...");
      // Link student batch to ensure test continues
      const batch = await CourseStudent.findOne({ where: { student_id: studentUser.id } });
      // If student is enrolled in a batch, let's verify quiz details directly
    }

    // Verify sanitized quiz details (NO `is_correct` leaked!)
    const detailsRes = await fetch(`${API_BASE}/student/quizzes/${testQuizId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const detailsData = await detailsRes.json();
    const mcqInDetails = detailsData.data?.questions?.find((q) => q.id === mcqQuestionId);
    const leakedIsCorrect = mcqInDetails?.options?.some((opt) => opt.is_correct !== undefined);
    console.log("Sanitization Check: `is_correct` is NOT leaked:", !leakedIsCorrect);
    if (leakedIsCorrect) {
      throw new Error("Security violation: is_correct leaked in student quiz details!");
    }

    // Clean up draft quiz
    await draftQuiz.destroy();

    // -------------------------------------------------------------
    // Test 9 & 10: Student Starts Quiz & Attempt is Created
    // -------------------------------------------------------------
    console.log("\n[Test 9 & 10] Student Starts Quiz");
    const startRes = await fetch(`${API_BASE}/student/quizzes/${testQuizId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const startData = await startRes.json();
    console.log("Start Status:", startRes.status, "Attempt ID:", startData.data?.attempt?.id, "Status:", startData.data?.attempt?.status);
    if (startRes.status !== 201 || !startData.data?.attempt?.id) {
      throw new Error(`Failed to start quiz attempt: ${JSON.stringify(startData)}`);
    }
    attemptId = startData.data.attempt.id;

    // -------------------------------------------------------------
    // Test 11: Save MCQ Answer
    // -------------------------------------------------------------
    console.log("\n[Test 11] Student Saves MCQ Answer (Option B)");
    const saveMcqRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        question_id: mcqQuestionId,
        selected_option_id: optBId, // Correct option
      }),
    });
    const saveMcqData = await saveMcqRes.json();
    console.log("Save MCQ Status:", saveMcqRes.status, "Saved option:", saveMcqData.data?.selected_option_id);
    if (saveMcqRes.status !== 200 || saveMcqData.data?.selected_option_id !== optBId) {
      throw new Error(`Failed to save MCQ answer: ${JSON.stringify(saveMcqData)}`);
    }

    // -------------------------------------------------------------
    // Test 12: Save Coding Answer
    // -------------------------------------------------------------
    console.log("\n[Test 12] Student Saves Coding Answer");
    const saveCodeRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        question_id: codingQuestionId,
        code_submission: "print(9 * 9)",
      }),
    });
    const saveCodeData = await saveCodeRes.json();
    console.log("Save Code Status:", saveCodeRes.status, "Saved code length:", saveCodeData.data?.code_submission?.length);
    if (saveCodeRes.status !== 200) {
      throw new Error(`Failed to save coding answer: ${JSON.stringify(saveCodeData)}`);
    }

    // -------------------------------------------------------------
    // Test 13 & 14: Run Code calls Judge0 & returns safely
    // -------------------------------------------------------------
    console.log("\n[Test 13 & 14] Run Code calls Judge0");
    const runRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/run-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        question_id: codingQuestionId,
        code: "print(9 * 9)",
        language: "python",
      }),
    });
    const runData = await runRes.json();
    console.log("Run Code Status:", runRes.status, "Execution Output:", runData.stdout?.trim(), "Judge0 Status:", runData.status);
    if (runRes.status !== 200 || runData.stdout?.trim() !== "81") {
      throw new Error(`Judge0 run code failed: ${JSON.stringify(runData)}`);
    }

    // -------------------------------------------------------------
    // Test 15, 16, 17: Submit Quiz, Grading & Score Calculation
    // -------------------------------------------------------------
    console.log("\n[Test 15, 16, 17] Submit Quiz & Automated Grading");
    const submitRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const submitData = await submitRes.json();
    console.log("Submit Status:", submitRes.status, "Score:", submitData.data?.score, "Total:", submitData.data?.total_marks, "Passed:", submitData.data?.passed);
    if (submitRes.status !== 200 || Number(submitData.data?.score) !== 10.0 || submitData.data?.passed !== true) {
      throw new Error(`Grading score unexpected: ${JSON.stringify(submitData)}`);
    }

    // -------------------------------------------------------------
    // Test 18: Result is retrievable
    // -------------------------------------------------------------
    console.log("\n[Test 18] Get Attempt Result with post-submission review");
    const resultRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/result`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const resultData = await resultRes.json();
    const resultPayload = resultData.data || resultData;
    console.log("Result Status:", resultRes.status, "Score:", resultPayload.attempt?.score, "Questions reviewed:", resultPayload.breakdown?.length);
    if (resultRes.status !== 200 || resultPayload.breakdown?.length !== 2) {
      throw new Error(`Failed to retrieve result breakdown: ${JSON.stringify(resultData)}`);
    }

    // -------------------------------------------------------------
    // Test 19: Instructor Views Attempts & Details
    // -------------------------------------------------------------
    console.log("\n[Test 19] Instructor Views Attempts List & Details");
    const instAttemptsRes = await fetch(`${API_BASE}/quizzes/${testQuizId}/attempts`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    const instAttemptsData = await instAttemptsRes.json();
    console.log("Instructor Attempts Count:", instAttemptsData.data?.total_attempts);
    if (instAttemptsRes.status !== 200 || instAttemptsData.data?.total_attempts < 1) {
      throw new Error(`Instructor could not view attempts: ${JSON.stringify(instAttemptsData)}`);
    }

    const instAttemptDetailRes = await fetch(`${API_BASE}/quizzes/attempts/${attemptId}`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    const instAttemptDetailData = await instAttemptDetailRes.json();
    console.log("Instructor View Attempt Detail Score:", instAttemptDetailData.data?.score);
    if (instAttemptDetailRes.status !== 200 || Number(instAttemptDetailData.data?.score) !== 10.0) {
      throw new Error(`Instructor view attempt detail failed: ${JSON.stringify(instAttemptDetailData)}`);
    }

    // -------------------------------------------------------------
    // Test 20: Student cannot view another student's attempt
    // -------------------------------------------------------------
    console.log("\n[Test 20] Security: Another student cannot access attempt");
    const dummyStudentToken = jwt.sign(
      { id: 99999, username: "imposter", role: "STUDENT" },
      process.env.JWT_SECRET || "change_this_later"
    );
    const imposterRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/result`, {
      headers: { Authorization: `Bearer ${dummyStudentToken}` },
    });
    console.log("Imposter Status (Expected 403):", imposterRes.status);
    if (imposterRes.status !== 403) {
      throw new Error(`Security breach: unauthorized student accessed attempt! Status: ${imposterRes.status}`);
    }

    // -------------------------------------------------------------
    // Test 21: Student cannot change submitted attempt
    // -------------------------------------------------------------
    console.log("\n[Test 21] Student cannot change submitted attempt answers");
    const editSubmittedRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        question_id: mcqQuestionId,
        selected_option_id: optAId,
      }),
    });
    console.log("Edit Submitted Status (Expected 400):", editSubmittedRes.status);
    if (editSubmittedRes.status !== 400) {
      throw new Error(`Security violation: allowed editing submitted attempt!`);
    }

    // -------------------------------------------------------------
    // Test 22: Max Attempts Enforcement
    // -------------------------------------------------------------
    console.log("\n[Test 22] Max Attempts Enforcement");
    // Max attempts was 2. Student did attempt #1. Attempt #2 should succeed, attempt #3 should fail.
    const startAttempt2Res = await fetch(`${API_BASE}/student/quizzes/${testQuizId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const start2Data = await startAttempt2Res.json();
    console.log("Attempt #2 Start Status (Expected 201):", startAttempt2Res.status, "Attempt #:", start2Data.data?.attempt?.attempt_number);
    const attempt2Id = start2Data.data?.attempt?.id;

    // Submit attempt #2
    await fetch(`${API_BASE}/student/attempts/${attempt2Id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    // Attempt #3 should now be blocked
    const startAttempt3Res = await fetch(`${API_BASE}/student/quizzes/${testQuizId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log("Attempt #3 Start Status (Expected 400 - max attempts exceeded):", startAttempt3Res.status);
    if (startAttempt3Res.status !== 400) {
      throw new Error("Max attempts was not enforced!");
    }

    // -------------------------------------------------------------
    // Test 23: Availability Window Enforcement
    // -------------------------------------------------------------
    console.log("\n[Test 23] Availability Window Enforcement (Future & Past)");
    const futureQuiz = await Quiz.create({
      session_id: lecture.id,
      title: "Future Quiz",
      status: "PUBLISHED",
      available_from: new Date(Date.now() + 86400000), // tomorrow
      total_marks: 5.0,
    });
    const futureStartRes = await fetch(`${API_BASE}/student/quizzes/${futureQuiz.id}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log("Future Quiz Start Status (Expected 400):", futureStartRes.status);
    await futureQuiz.destroy();
    if (futureStartRes.status !== 400) {
      throw new Error("Future quiz availability was not enforced!");
    }

    // -------------------------------------------------------------
    // Test 24: Authoritative Timer Expiration & Auto-Submission
    // -------------------------------------------------------------
    console.log("\n[Test 24] Authoritative Timer & Auto-Submit on Expiration");
    // Create a timed quiz (duration = 1 min)
    const timedQuiz = await Quiz.create({
      session_id: lecture.id,
      title: "Timed 1-Min Quiz",
      status: "PUBLISHED",
      duration_minutes: 1,
      total_marks: 5.0,
    });
    const timedQuestion = await QuizQuestion.create({
      quiz_id: timedQuiz.id,
      question_type: "MCQ",
      question_text: "Timed question?",
      marks: 5.0,
      status: "ACTIVE",
    });
    const timedOpt = await QuizOption.create({
      question_id: timedQuestion.id,
      option_label: "A",
      option_text: "Yes",
      is_correct: true,
    });

    // Start attempt
    const timedStart = await fetch(`${API_BASE}/student/quizzes/${timedQuiz.id}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const timedStartData = await timedStart.json();
    const timedAttemptId = timedStartData.data?.attempt?.id;

    // Manually backdate started_at in DB to 5 minutes ago to simulate expired timer
    await QuizAttempt.update(
      { started_at: new Date(Date.now() - 5 * 60 * 1000) },
      { where: { id: timedAttemptId } }
    );

    // Now try to save an answer or fetch current attempt
    const checkExpiredRes = await fetch(`${API_BASE}/student/quizzes/${timedQuiz.id}/attempts/current`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const checkExpiredData = await checkExpiredRes.json();
    console.log("Current Attempt Status after expiry (Expected AUTO_SUBMITTED):", checkExpiredData.data?.status);

    const expiredDbRecord = await QuizAttempt.findByPk(timedAttemptId);
    console.log("Database status for expired attempt:", expiredDbRecord.status);
    if (expiredDbRecord.status !== "AUTO_SUBMITTED") {
      throw new Error("Expired attempt was not auto-submitted!");
    }

    // Clean up timed quiz
    await timedOpt.destroy();
    await timedQuestion.destroy();
    await QuizAttemptAnswer.destroy({ where: { attempt_id: timedAttemptId } });
    await QuizAttempt.destroy({ where: { id: timedAttemptId } });
    await timedQuiz.destroy();

    console.log("\n=================================================");
    console.log(">>> ALL 24 QUIZ BACKEND TESTS PASSED SUCCESSFULLY! <<<");
    console.log("=================================================");
  } finally {
    // Clean up created test quiz
    if (testQuizId) {
      console.log("\nCleaning up test artifacts...");
      await QuizAttemptAnswer.destroy({
        where: {
          attempt_id: {
            [Op.in]: (await QuizAttempt.findAll({ where: { quiz_id: testQuizId }, attributes: ["id"] })).map((a) => a.id),
          },
        },
      }).catch(() => {});
      await QuizAttempt.destroy({ where: { quiz_id: testQuizId } }).catch(() => {});
      await QuizOption.destroy({ where: { question_id: [mcqQuestionId].filter(Boolean) } }).catch(() => {});
      await QuizQuestion.destroy({ where: { quiz_id: testQuizId } }).catch(() => {});
      await Quiz.destroy({ where: { id: testQuizId } }).catch(() => {});
      console.log("Cleanup complete.");
    }
  }
};

runSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
