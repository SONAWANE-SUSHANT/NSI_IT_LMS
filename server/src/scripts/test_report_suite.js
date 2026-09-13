const reportService = require("../services/report.service");
const { User } = require("../models");

async function testReportSuite() {
  console.log("==========================================");
  console.log("STARTING ADMIN REPORTS BACKEND TEST SUITE");
  console.log("==========================================");

  try {
    // 1. Overview Stats
    console.log("\n[1] Testing getOverviewStats()...");
    const overview = await reportService.getOverviewStats();
    console.log("Overview stats successfully fetched:");
    console.log(" - Total Students:", overview.users.totalStudents);
    console.log(" - Total Instructors:", overview.users.totalInstructors);
    console.log(" - Total Admins:", overview.users.totalAdmins);
    console.log(" - Active Batches:", overview.academic.activeBatches);
    console.log(" - Avg Completion %:", overview.academic.avgCompletionPercentage);
    console.log(" - Quiz Pass Rate %:", overview.assessments.quizPassRate);
    console.log(" - Active Devices:", overview.security.activeDevices);

    // 2. Student Progress Report
    console.log("\n[2] Testing getStudentProgressReport()...");
    const progressReport = await reportService.getStudentProgressReport();
    console.log(`Fetched ${progressReport.length} student progress records.`);
    if (progressReport.length > 0) {
      console.log(" Sample record:", {
        student_name: progressReport[0].student_name,
        batch_name: progressReport[0].batch_name,
        course_name: progressReport[0].course_name,
        completion_percentage: progressReport[0].completion_percentage,
      });
    }

    // 3. Quiz Performance Report
    console.log("\n[3] Testing getQuizPerformanceReport()...");
    const quizReport = await reportService.getQuizPerformanceReport();
    console.log(`Fetched ${quizReport.length} quiz performance records.`);
    if (quizReport.length > 0) {
      console.log(" Sample record:", {
        student_name: quizReport[0].student_name,
        quiz_title: quizReport[0].quiz_title,
        score: quizReport[0].score,
        total_marks: quizReport[0].total_marks,
        passed: quizReport[0].passed,
      });
    }

    // 4. Batch Analytics Report
    console.log("\n[4] Testing getBatchAnalyticsReport()...");
    const batchReport = await reportService.getBatchAnalyticsReport();
    console.log(`Fetched ${batchReport.length} batch analytics records.`);
    if (batchReport.length > 0) {
      console.log(" Sample batch:", {
        batch_name: batchReport[0].batch_name,
        course_name: batchReport[0].course_name,
        total_enrolled: batchReport[0].total_enrolled,
        instructors: batchReport[0].instructors,
      });
    }

    // 5. Course Feedback Report
    console.log("\n[5] Testing getCourseFeedbackReport()...");
    const feedbackReport = await reportService.getCourseFeedbackReport();
    console.log(`Fetched ${feedbackReport.length} feedback review records.`);

    // 6. Security Audit Report
    console.log("\n[6] Testing getSecurityAuditReport()...");
    const securityReport = await reportService.getSecurityAuditReport();
    console.log(`Fetched ${securityReport.length} security device records.`);
    if (securityReport.length > 0) {
      console.log(" Sample device:", {
        user_name: securityReport[0].user_name,
        device_name: securityReport[0].device_name,
        browser: securityReport[0].browser,
        status: securityReport[0].device_status,
      });
    }

    // 7. Student 360° Comprehensive Dossier Report
    console.log("\n[7] Testing getStudentDossierReport()...");
    const testStudent = await User.findOne({ where: { role_id: 3 } });
    if (testStudent) {
      console.log(`Fetching 360° Dossier for Student ID ${testStudent.id} (${testStudent.email})...`);
      const dossier = await reportService.getStudentDossierReport(testStudent.id);
      console.log("Dossier retrieved successfully:");
      console.log(" - Full Name:", dossier.student.full_name);
      console.log(" - KPI Overview:", dossier.kpi);
      console.log(" - Enrolled Courses:", dossier.enrollments.length);
      console.log(" - Quizzes Taken:", dossier.quizzes.length);
      console.log(" - Sessions Tracked:", dossier.sessions.length);
      console.log(" - Devices Registered:", dossier.devices.length);
    } else {
      console.log("No student found to test 360° dossier.");
    }

    console.log("\n==========================================");
    console.log("ALL ADMIN REPORTS BACKEND TESTS PASSED!");
    console.log("==========================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

testReportSuite();
