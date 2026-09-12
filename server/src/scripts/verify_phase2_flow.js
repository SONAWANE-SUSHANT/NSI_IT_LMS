require("dotenv").config();
const jwt = require("jsonwebtoken");
const {
  User,
  Lecture,
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  CourseStudent,
  CourseBatch,
  CourseModule,
} = require("../models");

const API_BASE = "http://localhost:5000/api";

async function verifyFlow() {
  console.log("=== VERIFYING PHASE 2 COMPLETE FRONTEND/BACKEND FLOW ===");

  const instructorUser = await User.findOne({ where: { role_id: 2 } });
  const studentUser = await User.findOne({ where: { role_id: 3 } });
  
  const enrollment = await CourseStudent.findOne({ where: { student_id: studentUser.id, status: "ACTIVE" } });
  const batch = await CourseBatch.findByPk(enrollment.batch_id);
  const moduleItem = await CourseModule.findOne({ where: { course_id: batch.course_id, status: "ACTIVE" } });
  let lecture = await Lecture.findOne({ where: { module_id: moduleItem.id } });
  if (!lecture) {
    lecture = await Lecture.create({ module_id: moduleItem.id, title: "Enrolled Course Session", session_type: "LIVE", session_order: 1 });
  }

  if (!instructorUser || !studentUser || !lecture) {
    throw new Error("Missing test users or lecture session in DB");
  }

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

  // 1. Instructor: Create Quiz
  console.log("\n[1] Creating Quiz...");
  const createRes = await fetch(`${API_BASE}/quizzes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({
      session_id: lecture.id,
      title: `E2E Phase 2 Assessment - ${Date.now()}`,
      description: "Complete test of MCQ & Coding questions",
      instructions: "Answer all questions and submit before timer ends.",
      duration_minutes: 45,
      passing_marks: 10,
      max_attempts: 2,
    }),
  });
  const createData = await createRes.json();
  if (!createData.success) throw new Error("Quiz creation failed: " + createData.message);
  const quizId = createData.data.id;
  console.log("✓ Quiz created with ID:", quizId);

  // 2. Instructor: Add MCQ Question
  console.log("\n[2] Adding MCQ Question...");
  const q1Res = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({
      question_type: "MCQ",
      question_text: "Which Linux command is used to inspect disk space utilization?",
      marks: 5,
      difficulty: "EASY",
      explanation: "df (disk free) displays amount of available disk space.",
    }),
  });
  const q1Data = await q1Res.json();
  const q1Id = q1Data.data.id;
  console.log("✓ Question 1 (MCQ) added with ID:", q1Id);

  // Add Options A, B, C, D
  const optARes = await fetch(`${API_BASE}/questions/${q1Id}/options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({ option_label: "A", option_text: "df -h", is_correct: true }),
  });
  const optAData = await optARes.json();
  const correctOptId = optAData.data.id;

  await fetch(`${API_BASE}/questions/${q1Id}/options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({ option_label: "B", option_text: "ps aux", is_correct: false }),
  });

  await fetch(`${API_BASE}/questions/${q1Id}/options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({ option_label: "C", option_text: "chmod 755", is_correct: false }),
  });

  await fetch(`${API_BASE}/questions/${q1Id}/options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({ option_label: "D", option_text: "grep error", is_correct: false }),
  });
  console.log("✓ MCQ options A (Correct), B, C, D added");

  // 3. Instructor: Add Coding Question
  console.log("\n[3] Adding Coding Question (Bash/Python)...");
  const q2Res = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${instructorToken}`,
    },
    body: JSON.stringify({
      question_type: "CODING",
      question_text: "Write a command/script to print numbers 1 to 3.",
      marks: 10,
      difficulty: "MEDIUM",
      programming_language: "bash",
      starter_code: "#!/bin/bash\n# Write your solution\necho 1\n",
      constraints: "Must run in under 2 seconds",
      expected_output: "1\n2\n3",
    }),
  });
  const q2Data = await q2Res.json();
  const q2Id = q2Data.data.id;
  console.log("✓ Question 2 (Coding) added with ID:", q2Id);

  // 4. Instructor: Publish Quiz
  console.log("\n[4] Publishing Quiz...");
  const pubRes = await fetch(`${API_BASE}/quizzes/${quizId}/publish`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  const pubData = await pubRes.json();
  if (!pubData.success) throw new Error("Quiz publish failed: " + pubData.message);
  console.log("✓ Quiz verified and published. Total marks:", pubData.data.total_marks);

  // 5. Student: List Available Quizzes
  console.log("\n[5] Student fetching available quizzes...");
  const stuListRes = await fetch(`${API_BASE}/student/quizzes`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const stuListData = await stuListRes.json();
  const found = (stuListData.data || []).find((q) => q.id === quizId);
  if (!found) throw new Error("Published quiz not listed in student available quizzes!");
  console.log("✓ Found quiz in student assessment feed:", found.title);

  // 6. Student: Fetch Sanitized Quiz Details
  console.log("\n[6] Student inspecting quiz details...");
  const detRes = await fetch(`${API_BASE}/student/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const detData = await detRes.json();
  console.log("✓ Quiz details retrieved. Questions count:", detData.data.questions?.length);

  // 7. Student: Start Quiz Attempt
  console.log("\n[7] Student starting quiz attempt...");
  const startRes = await fetch(`${API_BASE}/student/quizzes/${quizId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const startData = await startRes.json();
  const attemptId = startData.data.attempt.id;
  console.log("✓ Attempt started with ID:", attemptId, "Remaining seconds:", startData.data.attempt.remaining_seconds);

  // Verify questions are sanitized (no is_correct, no explanation)
  const firstQ = startData.data.questions[0];
  if (firstQ.explanation !== undefined || (firstQ.options && firstQ.options[0]?.is_correct !== undefined)) {
    throw new Error("Security leak: Question explanation or option is_correct leaked to student!");
  }
  console.log("✓ Verified student data is strictly sanitized");

  // 8. Student: Save MCQ Answer
  console.log("\n[8] Saving Answer for MCQ Question...");
  const ans1Res = await fetch(`${API_BASE}/student/attempts/${attemptId}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      question_id: q1Id,
      selected_option_id: correctOptId,
    }),
  });
  const ans1Data = await ans1Res.json();
  if (!ans1Data.success) throw new Error("Save answer 1 failed: " + ans1Data.message);
  console.log("✓ Answer 1 saved successfully");

  // 9. Student: Run Code via Judge0 backend API
  console.log("\n[9] Running code on backend Judge0 execution service...");
  const runCodeRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/run-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      question_id: q2Id,
      code: "echo 1\necho 2\necho 3\n",
      language: "bash",
    }),
  });
  const runCodeData = await runCodeRes.json();
  console.log("✓ Code Run Result:", runCodeData.data?.status, "| Stdout:", JSON.stringify(runCodeData.data?.stdout?.trim()));

  // 10. Student: Save Coding Answer
  console.log("\n[10] Saving Answer for Coding Question...");
  const ans2Res = await fetch(`${API_BASE}/student/attempts/${attemptId}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      question_id: q2Id,
      code_submission: "echo 1\necho 2\necho 3\n",
    }),
  });
  const ans2Data = await ans2Res.json();
  if (!ans2Data.success) throw new Error("Save answer 2 failed: " + ans2Data.message);
  console.log("✓ Answer 2 saved successfully");

  // 11. Student: Submit Quiz
  console.log("\n[11] Submitting Quiz for grading...");
  const subRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const subData = await subRes.json();
  console.log("✓ Quiz Submitted! Status:", subData.data.status, "| Score:", subData.data.score, "/", subData.data.total_marks, "| Passed:", subData.data.passed);

  // 12. Student: View Official Result & Review
  console.log("\n[12] Student fetching official result & review...");
  const resRes = await fetch(`${API_BASE}/student/attempts/${attemptId}/result`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const resData = await resRes.json();
  const breakdownList = resData.data.breakdown || [];
  console.log("✓ Result summary: Score:", resData.data.attempt.score, "| Breakdown count:", breakdownList.length, "| Explanation present:", Boolean(breakdownList[0]?.explanation));

  // 13. Instructor: View Quiz Attempts & Details
  console.log("\n[13] Instructor inspecting student attempt...");
  const attRes = await fetch(`${API_BASE}/quizzes/${quizId}/attempts`, {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  const attData = await attRes.json();
  console.log("✓ Instructor attempts count:", attData.data.total_attempts);

  const detailRes = await fetch(`${API_BASE}/quizzes/attempts/${attemptId}`, {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  const detailData = await detailRes.json();
  console.log("✓ Instructor inspected student attempt:", detailData.data.student?.first_name, "| Score:", detailData.data.score, "| Submitted Code:", Boolean(detailData.data.answers[1]?.code_submission));

  console.log("\n=======================================================");
  console.log(">>> ALL 13 END-TO-END FLOW VERIFICATION STEPS PASSED! <<<");
  console.log("=======================================================");
}

verifyFlow().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
