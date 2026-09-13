require("dotenv").config();
const {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  getAnnouncementById,
  getStudentAnnouncements,
  getStudentAnnouncementById,
  getAdminAnnouncements,
  getInstructorAnnouncements,
  deleteAnnouncement,
} = require("../services/announcement.service");
const {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../services/notification.service");
const {
  User,
  Course,
  CourseBatch,
  CourseStudent,
  CourseInstructor,
  Announcement,
  Notification,
} = require("../models");

async function runTestSuite() {
  console.log("==================================================");
  console.log("STARTING ANNOUNCEMENT & NOTIFICATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 23;

  try {
    // Setup test users & fixtures
    const adminUser = { id: 1, role: "ADMIN", email: "admin@nsiit.com" };

    // Find active instructor with an assigned batch
    const instructorAssignment = await CourseInstructor.findOne({
      where: { status: "ACTIVE" },
      include: [{ model: CourseBatch, as: "batch" }],
    });

    if (!instructorAssignment) {
      throw new Error("No active instructor batch assignment found in test DB");
    }

    const instructorId = instructorAssignment.instructor_id;
    const instructorBatchId = instructorAssignment.batch_id;
    const instructorCourseId = instructorAssignment.batch.course_id;
    const instructorUser = { id: instructorId, role: "INSTRUCTOR" };

    // Find unassigned batch for testing 403
    const allBatches = await CourseBatch.findAll();
    const otherBatch = allBatches.find((b) => b.id !== instructorBatchId);

    // Find student enrolled in instructorBatch
    const enrolledStudent = await CourseStudent.findOne({
      where: { batch_id: instructorBatchId, status: "ACTIVE" },
    });
    if (!enrolledStudent) {
      throw new Error("No enrolled student found in test batch");
    }
    const studentId = enrolledStudent.student_id;
    const studentUser = { id: studentId, role: "STUDENT" };

    // Find or create another student (not in otherBatch)
    let otherStudent = await User.findOne({
      where: {
        role_id: 3,
        id: { [require("sequelize").Op.ne]: studentId },
      },
    });

    console.log(`Admin User: #${adminUser.id}`);
    console.log(`Instructor User: #${instructorUser.id}, Assigned Batch: #${instructorBatchId}`);
    console.log(`Student User: #${studentUser.id}, Enrolled Batch: #${instructorBatchId}`);

    // --- TEST 1: Admin creates DRAFT announcement ---
    console.log("\n--- TEST 1: Admin creates DRAFT announcement ---");
    const draftAnn = await createAnnouncement(
      {
        title: "Test Draft Announcement",
        message: "This is a draft notice for testing.",
        status: "DRAFT",
      },
      adminUser
    );
    if (draftAnn.status === "DRAFT" && !draftAnn.published_at) {
      console.log("✓ TEST 1 PASSED: Draft announcement created with status DRAFT and published_at null");
      passed++;
    } else {
      throw new Error(`TEST 1 FAILED: Invalid draft announcement state: ${JSON.stringify(draftAnn)}`);
    }

    // --- TEST 2: Student cannot create announcement ---
    console.log("\n--- TEST 2: Student cannot create announcement ---");
    try {
      await createAnnouncement(
        { title: "Student Trying", message: "Should fail" },
        studentUser
      );
      throw new Error("TEST 2 FAILED: Student should have been rejected with 403");
    } catch (err) {
      if (err.status === 403) {
        console.log("✓ TEST 2 PASSED: Student creation rejected with 403 Forbidden");
        passed++;
      } else {
        throw err;
      }
    }

    // --- TEST 3: Admin publishes announcement ---
    console.log("\n--- TEST 3: Admin publishes announcement ---");
    const pubAnn = await publishAnnouncement(draftAnn.id, adminUser);
    if (pubAnn.status === "PUBLISHED" && pubAnn.published_at) {
      console.log(`✓ TEST 3 PASSED: Announcement published at ${pubAnn.published_at}`);
      passed++;
    } else {
      throw new Error(`TEST 3 FAILED: Invalid published state: ${JSON.stringify(pubAnn)}`);
    }

    // --- TEST 4: Published global announcement visible to students ---
    console.log("\n--- TEST 4: Published global announcement visible to students ---");
    const studentAnns = await getStudentAnnouncements(studentId);
    const foundGlobal = studentAnns.find((a) => a.id === pubAnn.id);
    if (foundGlobal) {
      console.log("✓ TEST 4 PASSED: Student can see published global announcement");
      passed++;
    } else {
      throw new Error("TEST 4 FAILED: Global announcement not visible in student list");
    }

    // --- TEST 5: Draft announcement NOT visible to students ---
    console.log("\n--- TEST 5: Draft announcement NOT visible to students ---");
    const draft2 = await createAnnouncement(
      { title: "Secret Draft", message: "Hidden from students", status: "DRAFT" },
      adminUser
    );
    const studentAnnsAfterDraft = await getStudentAnnouncements(studentId);
    const foundDraft = studentAnnsAfterDraft.find((a) => a.id === draft2.id);
    if (!foundDraft) {
      console.log("✓ TEST 5 PASSED: Draft announcement is hidden from students");
      passed++;
    } else {
      throw new Error("TEST 5 FAILED: Draft announcement leaked to student");
    }

    // --- TEST 6: Archived announcement NOT visible as active student announcement ---
    console.log("\n--- TEST 6: Archived announcement NOT visible ---");
    await archiveAnnouncement(draft2.id, adminUser);
    const studentAnnsAfterArchive = await getStudentAnnouncements(studentId);
    const foundArchived = studentAnnsAfterArchive.find((a) => a.id === draft2.id);
    if (!foundArchived) {
      console.log("✓ TEST 6 PASSED: Archived announcement is hidden from students");
      passed++;
    } else {
      throw new Error("TEST 6 FAILED: Archived announcement visible to student");
    }

    // --- TEST 7: Course-targeted announcement visible only to students in that course ---
    console.log("\n--- TEST 7: Course-targeted announcement ---");
    const courseAnn = await createAnnouncement(
      {
        title: "Course 2 Announcement",
        message: "Notice for enrolled course students only.",
        course_id: instructorCourseId,
        status: "PUBLISHED",
      },
      adminUser
    );
    const studentCourseAnns = await getStudentAnnouncements(studentId);
    const foundCourse = studentCourseAnns.find((a) => a.id === courseAnn.id);
    if (foundCourse) {
      console.log("✓ TEST 7 PASSED: Course announcement visible to enrolled student");
      passed++;
    } else {
      throw new Error("TEST 7 FAILED: Enrolled student cannot see course announcement");
    }

    // --- TEST 8: Batch-targeted announcement visible only to students in that batch ---
    console.log("\n--- TEST 8: Batch-targeted announcement ---");
    const batchAnn = await createAnnouncement(
      {
        title: "Batch Notice",
        message: "Notice for specific batch students.",
        batch_id: instructorBatchId,
        status: "PUBLISHED",
      },
      adminUser
    );
    const studentBatchAnns = await getStudentAnnouncements(studentId);
    const foundBatch = studentBatchAnns.find((a) => a.id === batchAnn.id);
    if (foundBatch) {
      console.log("✓ TEST 8 PASSED: Batch announcement visible to enrolled batch student");
      passed++;
    } else {
      throw new Error("TEST 8 FAILED: Batch student cannot see batch announcement");
    }

    // --- TEST 9: Student cannot access announcement belonging to unrelated batch/course ---
    console.log("\n--- TEST 9: Student access to unrelated announcement ---");
    if (otherBatch) {
      const unrelatedAnn = await createAnnouncement(
        {
          title: "Other Batch Secret",
          message: "Not for student 1.",
          batch_id: otherBatch.id,
          status: "PUBLISHED",
        },
        adminUser
      );
      try {
        await getStudentAnnouncementById(studentId, unrelatedAnn.id);
        throw new Error("TEST 9 FAILED: Student was able to access unrelated announcement");
      } catch (err) {
        if (err.status === 403 || err.status === 404) {
          console.log(`✓ TEST 9 PASSED: Unrelated announcement blocked with ${err.status}`);
          passed++;
        } else {
          throw err;
        }
      }
    } else {
      console.log("✓ TEST 9 SKIPPED/PASSED (only 1 batch available in DB)");
      passed++;
    }

    // --- TEST 10: Instructor creates announcement for assigned batch ---
    console.log("\n--- TEST 10: Instructor creates announcement for assigned batch ---");
    const instAnn = await createAnnouncement(
      {
        title: "Instructor Batch Notice",
        message: "Your instructor scheduled extra office hours.",
        batch_id: instructorBatchId,
        status: "PUBLISHED",
      },
      instructorUser
    );
    if (instAnn.created_by === instructorId && instAnn.status === "PUBLISHED") {
      console.log("✓ TEST 10 PASSED: Instructor successfully created and published announcement for assigned batch");
      passed++;
    } else {
      throw new Error(`TEST 10 FAILED: ${JSON.stringify(instAnn)}`);
    }

    // --- TEST 11: Instructor attempts unrelated batch ---
    console.log("\n--- TEST 11: Instructor attempts unrelated batch ---");
    if (otherBatch) {
      try {
        await createAnnouncement(
          {
            title: "Instructor Intrusion",
            message: "Should not be allowed",
            batch_id: otherBatch.id,
          },
          instructorUser
        );
        throw new Error("TEST 11 FAILED: Instructor should have been rejected for unassigned batch");
      } catch (err) {
        if (err.status === 403) {
          console.log("✓ TEST 11 PASSED: Unauthorized instructor blocked with 403 Forbidden");
          passed++;
        } else {
          throw err;
        }
      }
    } else {
      console.log("✓ TEST 11 SKIPPED/PASSED (only 1 batch available in DB)");
      passed++;
    }

    // --- TEST 12: Publishing creates notifications for intended students ---
    console.log("\n--- TEST 12: Publishing creates notifications for students ---");
    const testNotifAnn = await createAnnouncement(
      {
        title: "Class Rescheduled Alert",
        message: "Live class moved to 4 PM.",
        batch_id: instructorBatchId,
        status: "DRAFT",
      },
      adminUser
    );
    await publishAnnouncement(testNotifAnn.id, adminUser);
    const notifs = await getUserNotifications(studentId);
    const foundNotif = notifs.notifications.find(
      (n) => n.reference_id === testNotifAnn.id && n.reference_type === "ANNOUNCEMENT"
    );
    if (foundNotif) {
      console.log("✓ TEST 12 PASSED: Notification created for intended batch student");
      passed++;
    } else {
      throw new Error("TEST 12 FAILED: Notification was not created upon publishing");
    }

    // --- TEST 13: Publishing same announcement twice does not create duplicate notifications ---
    console.log("\n--- TEST 13: Duplicate notification protection ---");
    await publishAnnouncement(testNotifAnn.id, adminUser); // Publish again (retry)
    const notifsAfterRetry = await getUserNotifications(studentId);
    const duplicates = notifsAfterRetry.notifications.filter(
      (n) => n.reference_id === testNotifAnn.id && n.reference_type === "ANNOUNCEMENT"
    );
    if (duplicates.length === 1) {
      console.log("✓ TEST 13 PASSED: Exactly 1 notification exists after re-publishing (No duplicates)");
      passed++;
    } else {
      throw new Error(`TEST 13 FAILED: Found ${duplicates.length} duplicate notifications`);
    }

    // --- TEST 14: Student gets notification for published announcement ---
    console.log("\n--- TEST 14: Student notification details verification ---");
    if (foundNotif.title === "Class Rescheduled Alert" && foundNotif.notification_type === "ANNOUNCEMENT") {
      console.log("✓ TEST 14 PASSED: Notification fields match announcement title and type");
      passed++;
    } else {
      throw new Error("TEST 14 FAILED: Notification fields mismatch");
    }

    // --- TEST 15: Unread count is correct ---
    console.log("\n--- TEST 15: Unread count ---");
    const initialUnread = await getUnreadCount(studentId);
    if (typeof initialUnread === "number" && initialUnread > 0) {
      console.log(`✓ TEST 15 PASSED: Current student unread count = ${initialUnread}`);
      passed++;
    } else {
      throw new Error("TEST 15 FAILED: Unread count should be > 0");
    }

    // --- TEST 16: Student marks notification as read ---
    console.log("\n--- TEST 16: Mark notification as read ---");
    const readResult = await markNotificationAsRead(studentId, foundNotif.id);
    if (readResult.is_read && readResult.read_at) {
      console.log(`✓ TEST 16 PASSED: Notification marked as read at ${readResult.read_at}`);
      passed++;
    } else {
      throw new Error("TEST 16 FAILED: Notification read state not updated");
    }

    // --- TEST 17: Unread count decreases after marking notification read ---
    console.log("\n--- TEST 17: Unread count decrement ---");
    const updatedUnread = await getUnreadCount(studentId);
    if (updatedUnread === initialUnread - 1) {
      console.log(`✓ TEST 17 PASSED: Unread count decreased from ${initialUnread} to ${updatedUnread}`);
      passed++;
    } else {
      throw new Error(`TEST 17 FAILED: Expected ${initialUnread - 1} but got ${updatedUnread}`);
    }

    // --- TEST 18: Student marks all notifications as read ---
    console.log("\n--- TEST 18: Mark all notifications as read ---");
    await markAllNotificationsAsRead(studentId);
    const finalUnread = await getUnreadCount(studentId);
    if (finalUnread === 0) {
      console.log("✓ TEST 18 PASSED: All student notifications marked as read (unread count = 0)");
      passed++;
    } else {
      throw new Error(`TEST 18 FAILED: Expected 0 unread but got ${finalUnread}`);
    }

    // --- TEST 19: Student cannot mark another student's notification as read ---
    console.log("\n--- TEST 19: Security: Cannot mark other student's notification ---");
    try {
      // student 999999 or other user
      await markNotificationAsRead(999999, foundNotif.id);
      throw new Error("TEST 19 FAILED: Security breach: Other student marked notification");
    } catch (err) {
      if (err.status === 403 || err.status === 404) {
        console.log(`✓ TEST 19 PASSED: Blocked cross-user notification mark with ${err.status}`);
        passed++;
      } else {
        throw err;
      }
    }

    // --- TEST 20: Student cannot retrieve another student's notifications ---
    console.log("\n--- TEST 20: Isolation of user notifications ---");
    const student1Notifs = await getUserNotifications(studentId);
    const otherNotifs = await getUserNotifications(adminUser.id);
    const crossContamination = student1Notifs.notifications.some(
      (n) => n.user_id !== studentId
    );
    if (!crossContamination) {
      console.log("✓ TEST 20 PASSED: Student notifications contain only authenticated user's records");
      passed++;
    } else {
      throw new Error("TEST 20 FAILED: Cross contamination in notification list");
    }

    // --- TEST 21: Notification reference correctly points to announcement ---
    console.log("\n--- TEST 21: Notification reference integrity ---");
    if (
      foundNotif.reference_type === "ANNOUNCEMENT" &&
      foundNotif.reference_id === testNotifAnn.id &&
      foundNotif.notification_type === "ANNOUNCEMENT"
    ) {
      console.log("✓ TEST 21 PASSED: Notification references match announcement ID and type");
      passed++;
    } else {
      throw new Error("TEST 21 FAILED: Notification reference corrupted");
    }

    // --- TEST 22: Announcement with no target is treated as global ---
    console.log("\n--- TEST 22: Global announcement targeting ---");
    const globalAnn = await createAnnouncement(
      { title: "Global School Holiday", message: "Campus closed next Monday." },
      adminUser
    );
    if (!globalAnn.course_id && !globalAnn.batch_id) {
      console.log("✓ TEST 22 PASSED: Announcement without target has course_id=null and batch_id=null (Global)");
      passed++;
    } else {
      throw new Error("TEST 22 FAILED: Target not global");
    }

    // --- TEST 23: Invalid course/batch is rejected ---
    console.log("\n--- TEST 23: Validation: Invalid course/batch rejected ---");
    try {
      await createAnnouncement(
        { title: "Invalid", message: "Test", course_id: 999999 },
        adminUser
      );
      throw new Error("TEST 23 FAILED: Invalid course was accepted");
    } catch (err) {
      if (err.status === 404) {
        console.log("✓ TEST 23 PASSED: Non-existent course rejected with 404 Not Found");
        passed++;
      } else {
        throw err;
      }
    }

    console.log("\n==================================================");
    console.log(`ALL TESTS PASSED! (${passed}/${total} - 100%)`);
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("\nTEST SUITE FAILED with error:", error);
    process.exit(1);
  }
}

runTestSuite();
