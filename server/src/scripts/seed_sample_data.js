const sequelize = require("../config/database");
const {
  Course,
  CourseBatch,
  CourseInstructor,
  CourseStudent,
  CourseModule,
  Lecture,
  LectureNote,
  User,
} = require("../models");

async function seedSampleData() {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    const admin = await User.findOne({ where: { email: "admin@nsiit.com" } });
    const instructor = await User.findOne({ where: { email: "instructor@nsiit.com" } });
    const student = await User.findOne({ where: { email: "student@nsiit.com" } });

    if (!admin || !instructor || !student) {
      console.error("Required users not found. Run seedAdmin.js first.");
      return;
    }

    // 1. Course
    let course = await Course.findOne({ where: { code: "FSWD-01" } });
    if (!course) {
      course = await Course.create({
        code: "FSWD-01",
        name: "Full Stack Web Development Masterclass",
        description: "Comprehensive industry bootcamp covering React 19, Tailwind CSS, Node.js, Express, and MySQL.",
        duration: "6 Months",
        status: "ACTIVE",
        created_by: admin.id,
        updated_by: admin.id,
      });
      console.log("Created Course:", course.name);
    }

    // 2. Batch
    let batch = await CourseBatch.findOne({ where: { course_id: course.id } });
    if (!batch) {
      batch = await CourseBatch.create({
        course_id: course.id,
        name: "FSWD-2026-Cohort-A",
        description: "Morning interactive batch with live projects and code reviews.",
        start_date: "2026-09-01",
        end_date: "2027-02-28",
        batch_mode: "ONLINE",
        batch_time: "MORNING",
        batch_schedule: "WEEKDAYS",
        status: "ACTIVE",
        created_by: admin.id,
        updated_by: admin.id,
      });
      await batch.reload();
      console.log("Created Batch:", batch.name, "Code:", batch.batch_code);
    }

    // 3. Instructor Assignment
    let instructorAssign = await CourseInstructor.findOne({
      where: { batch_id: batch.id, instructor_id: instructor.id },
    });
    if (!instructorAssign) {
      instructorAssign = await CourseInstructor.create({
        batch_id: batch.id,
        instructor_id: instructor.id,
        status: "ACTIVE",
        assigned_at: new Date(),
        assigned_by: admin.id,
        updated_by: admin.id,
      });
      console.log("Assigned Instructor to Batch.");
    }

    // 4. Student Enrollment
    let studentEnroll = await CourseStudent.findOne({
      where: { batch_id: batch.id, student_id: student.id },
    });
    if (!studentEnroll) {
      studentEnroll = await CourseStudent.create({
        batch_id: batch.id,
        student_id: student.id,
        status: "ACTIVE",
        enrollment_date: new Date(),
        created_by: admin.id,
        updated_by: admin.id,
      });
      console.log("Enrolled Student into Batch.");
    }

    // 5. Course Module
    let module1 = await CourseModule.findOne({ where: { course_id: course.id } });
    if (!module1) {
      module1 = await CourseModule.create({
        course_id: course.id,
        name: "Module 1: React 19 & Modern UI Architecture",
        description: "Master component-driven architecture, Tailwind CSS v4, custom hooks, and state management.",
        display_order: 1,
        duration: "4 Weeks",
        status: "ACTIVE",
        created_by: instructor.id,
        updated_by: instructor.id,
      });
      console.log("Created Module:", module1.name);
    }

    // 6. Lecture / Session
    let session = await Lecture.findOne({ where: { module_id: module1.id } });
    if (!session) {
      session = await Lecture.create({
        module_id: module1.id,
        instructor_id: instructor.id,
        title: "Deep Dive into Modular Component Design & Tailwind CSS",
        description: "Live workshop on composing reusable, responsive UI components with clean separation of concerns.",
        session_type: "LIVE",
        status: "PUBLISHED",
        display_order: 1,
        scheduled_at: new Date(Date.now() + 86400000), // Tomorrow
        duration_minutes: 90,
        session_url: "https://meet.google.com/nsi-lms-demo",
        created_by: instructor.id,
        updated_by: instructor.id,
      });
      console.log("Created Live Session:", session.title);

      // 7. Lecture Notes
      await LectureNote.create({
        session_id: session.id,
        title: "Component Architecture Cheatsheet & Code Patterns",
        note_type: "LINK",
        external_url: "https://github.com/reactjs",
        display_order: 1,
        status: "ACTIVE",
        created_by: instructor.id,
        updated_by: instructor.id,
      });
      console.log("Created Lecture Note.");
    }

    console.log("Sample LMS data seeded successfully!");
  } catch (error) {
    console.error("Failed to seed sample data:", error);
  } finally {
    await sequelize.close();
  }
}

seedSampleData();
