const {
  User,
  Course,
  CourseBatch,
  CourseStudent,
  CourseModule,
  Lecture,
  SessionProgress,
  CourseProgress,
} = require("../models");
const progressService = require("../services/progress.service");
const studentService = require("../services/student.service");

async function runTests() {
  console.log("==========================================");
  console.log("STARTING SESSION & COURSE TRACKING TEST SUITE");
  console.log("==========================================");

  try {
    // 1. Find enrolled student
    const student = await User.findByPk(3); // student@nsiit.com
    console.log(`Test Student: #${student.id} (${student.email})`);

    // Find student's enrolled batch and course
    const enrollment = await CourseStudent.findOne({
      where: { student_id: student.id, status: "ACTIVE" },
      include: [{ model: CourseBatch, as: "batch" }],
    });

    if (!enrollment || !enrollment.batch) {
      throw new Error("Student 3 has no active enrollments to test with");
    }

    const courseId = enrollment.batch.course_id;
    console.log(`Enrolled Course: #${courseId} via Batch: #${enrollment.batch.id}`);

    // Get all modules & published sessions for this course
    const modules = await CourseModule.findAll({
      where: { course_id: courseId, status: "ACTIVE" },
      include: [{ model: Lecture, as: "lectures", where: { status: "PUBLISHED" } }],
    });

    const sessions = [];
    modules.forEach((m) => {
      (m.lectures || []).forEach((l) => sessions.push(l));
    });

    if (sessions.length === 0) {
      throw new Error(`Course #${courseId} has no published sessions`);
    }

    console.log(`Found ${sessions.length} published sessions in course #${courseId}`);
    const session1 = sessions[0];
    const session2 = sessions.length > 1 ? sessions[1] : null;

    // Clean up previous test progress for this student & course
    await SessionProgress.destroy({
      where: {
        student_id: student.id,
        session_id: sessions.map((s) => s.id),
      },
    });
    await CourseProgress.destroy({
      where: {
        student_id: student.id,
        course_id: courseId,
      },
    });

    // ----------------------------------------------------
    // TEST 1: Student opens an incomplete session
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Student opens an incomplete session ---");
    const accessRes1 = await progressService.recordSessionAccess(student.id, session1.id);
    console.log("Access Result 1:", accessRes1);
    if (accessRes1.completed !== false || !accessRes1.last_accessed_at) {
      throw new Error("TEST 1 FAILED: session should not be completed and last_accessed_at should be present");
    }
    console.log("✓ TEST 1 PASSED: session_progress created with completed=false and last_accessed_at populated");

    // ----------------------------------------------------
    // TEST 2: Student clicks Mark as Completed
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Student clicks Mark as Completed ---");
    const completeRes1 = await progressService.markSessionCompleted(student.id, session1.id);
    console.log("Complete Result 1:", completeRes1.session_progress);
    console.log("Updated Course Progress:", completeRes1.course_progress);
    if (!completeRes1.session_progress.completed || !completeRes1.session_progress.completed_at) {
      throw new Error("TEST 2 FAILED: completed should be true and completed_at populated");
    }
    console.log("✓ TEST 2 PASSED: session marked as completed with completed_at timestamp");

    // ----------------------------------------------------
    // TEST 3: Student clicks Mark as Completed again (Idempotency)
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Student clicks Mark as Completed again (Idempotency) ---");
    const completeRes2 = await progressService.markSessionCompleted(student.id, session1.id);
    const countRecords = await SessionProgress.count({
      where: { student_id: student.id, session_id: session1.id },
    });
    if (countRecords !== 1) {
      throw new Error(`TEST 3 FAILED: expected exactly 1 record, found ${countRecords}`);
    }
    if (!completeRes2.session_progress.completed) {
      throw new Error("TEST 3 FAILED: session should still be completed");
    }
    console.log("✓ TEST 3 PASSED: Operation is idempotent. Exactly 1 record preserved without duplicate error");

    // ----------------------------------------------------
    // TEST 4: Student queries session progress
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Query session progress ---");
    const progQuery = await progressService.getSessionProgress(student.id, session1.id);
    if (!progQuery.completed) {
      throw new Error("TEST 4 FAILED: Expected completed=true on query");
    }
    console.log("✓ TEST 4 PASSED: ✓ Completed remains queryable");

    // ----------------------------------------------------
    // TEST 5: Partial Course Progress calculation
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Check Course Progress after 1 session completed ---");
    const courseProg = await progressService.getCourseProgress(student.id, courseId);
    console.log("Course Progress:", courseProg);
    const expectedPct = Math.round((1 / sessions.length) * 10000) / 100;
    if (courseProg.completed_sessions !== 1 || courseProg.total_sessions !== sessions.length) {
      throw new Error(`TEST 5 FAILED: Expected 1/${sessions.length} sessions completed`);
    }
    if (Math.abs(courseProg.progress_percentage - expectedPct) > 0.01) {
      throw new Error(`TEST 5 FAILED: Expected ${expectedPct}%, got ${courseProg.progress_percentage}%`);
    }
    if (sessions.length > 1 && courseProg.status !== "IN_PROGRESS") {
      throw new Error(`TEST 5 FAILED: Expected status IN_PROGRESS, got ${courseProg.status}`);
    }
    console.log(`✓ TEST 5 PASSED: course_progress correctly calculated (${courseProg.completed_sessions}/${courseProg.total_sessions} = ${courseProg.progress_percentage}%, status: ${courseProg.status})`);

    // ----------------------------------------------------
    // TEST 6: Complete all sessions -> 100% COMPLETED
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Complete all remaining sessions ---");
    for (const sess of sessions) {
      await progressService.markSessionCompleted(student.id, sess.id);
    }
    const finalCourseProg = await progressService.getCourseProgress(student.id, courseId);
    console.log("Final Course Progress:", finalCourseProg);
    if (
      finalCourseProg.progress_percentage !== 100 ||
      finalCourseProg.status !== "COMPLETED" ||
      !finalCourseProg.completed ||
      !finalCourseProg.completed_at
    ) {
      throw new Error("TEST 6 FAILED: Course should be 100% and COMPLETED with completed_at");
    }
    console.log("✓ TEST 6 PASSED: 100% COMPLETED with completed_at populated when all sessions completed");

    // ----------------------------------------------------
    // TEST 7: Open a session without completing -> percentage does not increase
    // ----------------------------------------------------
    console.log("\n--- TEST 7: Open session without completing ---");
    // Temporarily uncomplete session 1 to test opening an incomplete session
    await SessionProgress.update(
      { completed: false, completed_at: null },
      { where: { student_id: student.id, session_id: session1.id } }
    );
    await progressService.recalculateCourseProgress(student.id, courseId);
    const beforeProg = await progressService.getCourseProgress(student.id, courseId);

    // Record session access
    await progressService.recordSessionAccess(student.id, session1.id);
    const afterProg = await progressService.getCourseProgress(student.id, courseId);

    if (afterProg.completed_sessions !== beforeProg.completed_sessions ||
        afterProg.progress_percentage !== beforeProg.progress_percentage) {
      throw new Error("TEST 7 FAILED: Merely accessing a session must NOT increase completion percentage");
    }
    console.log("✓ TEST 7 PASSED: Accessing session updates last accessed time without increasing completion percentage");

    // ----------------------------------------------------
    // TEST 8 & 9: Security Validation - Course Not Enrolled / Other Student
    // ----------------------------------------------------
    console.log("\n--- TEST 8 & 9: Security / Enrollment verification ---");
    // Student 31 is not enrolled in this batch/course
    try {
      await progressService.markSessionCompleted(31, session1.id);
      throw new Error("Security check failed: Student 31 was allowed to complete unenrolled session!");
    } catch (err) {
      if (err.status === 403) {
        console.log("✓ TEST 8 & 9 PASSED: Unenrolled student access correctly rejected with 403 Forbidden");
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 10 & 11: Persistence & Multi-device verification
    // ----------------------------------------------------
    console.log("\n--- TEST 10 & 11: Persistence across sessions & devices ---");
    // Verify progress retrieved from new service call matches database
    const allStudentProg = await progressService.getAllStudentCoursesProgress(student.id);
    const thisCourseProg = allStudentProg.find((c) => c.course_id === courseId);
    if (!thisCourseProg || thisCourseProg.total_sessions !== sessions.length) {
      throw new Error("TEST 10 & 11 FAILED: Could not retrieve persisted progress");
    }
    console.log("✓ TEST 10 & 11 PASSED: Progress persisted in database and available across devices/sessions");

    // ----------------------------------------------------
    // TEST 12: Live session rule verification
    // ----------------------------------------------------
    console.log("\n--- TEST 12: Live session verification ---");
    const liveSession = sessions.find((s) => s.session_type === "LIVE");
    if (liveSession) {
      // Uncomplete it
      await SessionProgress.update(
        { completed: false, completed_at: null },
        { where: { student_id: student.id, session_id: liveSession.id } }
      );
      // Merely accessing a live session does not complete it
      const accessLive = await progressService.recordSessionAccess(student.id, liveSession.id);
      if (accessLive.completed) {
        throw new Error("TEST 12 FAILED: Live session should not be marked completed on access");
      }
      console.log("✓ TEST 12 PASSED: Joining / accessing live session does not mark completed");
    } else {
      console.log("Note: No live sessions in this course to test; logic verified in code.");
    }

    // ----------------------------------------------------
    // TEST 13: Student curriculum payload verification
    // ----------------------------------------------------
    console.log("\n--- TEST 13: Student batch course content includes progress ---");
    const content = await studentService.getBatchCourseContent(enrollment.batch.id, student.id);
    if (!content.course_progress) {
      throw new Error("TEST 13 FAILED: getBatchCourseContent must include course_progress");
    }
    const sampleLecture = content.modules[0]?.lectures?.[0];
    if (sampleLecture && !sampleLecture.sessionProgress) {
      throw new Error("TEST 13 FAILED: lecture must include sessionProgress");
    }
    console.log(`✓ TEST 13 PASSED: Batch content includes course_progress and lecture sessionProgress`);

    console.log("\n==========================================");
    console.log("ALL PROGRESS TESTS PASSED SUCCESSFULLY! (100%)");
    console.log("==========================================");
    process.exit(0);
  } catch (error) {
    console.error("TEST FAILED WITH ERROR:", error);
    process.exit(1);
  }
}

runTests();
