const User = require("./User");
const UserRole = require("./UserRole");
const Course = require("./Course");
const CourseBatch = require("./CourseBatch");
const CourseInstructor = require("./CourseInstructor");
const CourseStudent = require("./CourseStudent");
const CourseModule = require("./CourseModule");
const Lecture = require("./Lecture");
const LectureNote = require("./LectureNote");
const Quiz = require("./Quiz");
const QuizQuestion = require("./QuizQuestion");
const QuizOption = require("./QuizOption");
const UserDevice = require("./UserDevice");

// 1. User ↔ Role
UserRole.hasMany(User, {
  foreignKey: "role_id",
  as: "users",
});

User.belongsTo(UserRole, {
  foreignKey: "role_id",
  as: "role",
});

// 2. Course ↔ Batches
CourseBatch.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

Course.hasMany(CourseBatch, {
  foreignKey: "course_id",
  as: "batches",
});

// 3. Course ↔ Modules
Course.hasMany(CourseModule, {
  foreignKey: "course_id",
  as: "modules",
});

CourseModule.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

// 4. Module ↔ Sessions (Lectures)
CourseModule.hasMany(Lecture, {
  foreignKey: "module_id",
  as: "lectures",
});

Lecture.belongsTo(CourseModule, {
  foreignKey: "module_id",
  as: "module",
});

// 5. Session ↔ Notes
Lecture.hasMany(LectureNote, {
  foreignKey: "session_id",
  as: "notes",
});

LectureNote.belongsTo(Lecture, {
  foreignKey: "session_id",
  as: "lecture",
});

// 6. Session ↔ Instructor
Lecture.belongsTo(User, {
  foreignKey: "instructor_id",
  as: "instructor",
});

User.hasMany(Lecture, {
  foreignKey: "instructor_id",
  as: "conductedSessions",
});

// 7. Batch Instructors
CourseInstructor.belongsTo(CourseBatch, {
  foreignKey: "batch_id",
  as: "batch",
});

CourseInstructor.belongsTo(User, {
  foreignKey: "instructor_id",
  as: "instructor",
});

CourseBatch.hasMany(CourseInstructor, {
  foreignKey: "batch_id",
  as: "instructors",
});

User.hasMany(CourseInstructor, {
  foreignKey: "instructor_id",
  as: "batchAssignments",
});

// 8. Batch Students
CourseStudent.belongsTo(CourseBatch, {
  foreignKey: "batch_id",
  as: "batch",
});

CourseStudent.belongsTo(User, {
  foreignKey: "student_id",
  as: "student",
});

CourseBatch.hasMany(CourseStudent, {
  foreignKey: "batch_id",
  as: "students",
});

User.hasMany(CourseStudent, {
  foreignKey: "student_id",
  as: "enrollments",
});

// 9. Session ↔ Quizzes
Lecture.hasMany(Quiz, {
  foreignKey: "session_id",
  as: "quizzes",
});

Quiz.belongsTo(Lecture, {
  foreignKey: "session_id",
  as: "session",
});

// Module ↔ Quizzes
CourseModule.hasMany(Quiz, {
  foreignKey: "module_id",
  as: "quizzes",
});

Quiz.belongsTo(CourseModule, {
  foreignKey: "module_id",
  as: "module",
});

// Course ↔ Quizzes
Course.hasMany(Quiz, {
  foreignKey: "course_id",
  as: "quizzes",
});

Quiz.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

// 10. Quiz ↔ QuizQuestions
Quiz.hasMany(QuizQuestion, {
  foreignKey: "quiz_id",
  as: "questions",
});

QuizQuestion.belongsTo(Quiz, {
  foreignKey: "quiz_id",
  as: "quiz",
});

// 11. QuizQuestion ↔ QuizOptions
QuizQuestion.hasMany(QuizOption, {
  foreignKey: "question_id",
  as: "options",
});

QuizOption.belongsTo(QuizQuestion, {
  foreignKey: "question_id",
  as: "question",
});

// 12. Quiz ↔ QuizAttempts
const QuizAttempt = require("./QuizAttempt");
const QuizAttemptAnswer = require("./QuizAttemptAnswer");

Quiz.hasMany(QuizAttempt, {
  foreignKey: "quiz_id",
  as: "attempts",
});

QuizAttempt.belongsTo(Quiz, {
  foreignKey: "quiz_id",
  as: "quiz",
});

// 13. Student (User) ↔ QuizAttempts
User.hasMany(QuizAttempt, {
  foreignKey: "student_id",
  as: "quizAttempts",
});

QuizAttempt.belongsTo(User, {
  foreignKey: "student_id",
  as: "student",
});

// 14. QuizAttempt ↔ QuizAttemptAnswers
QuizAttempt.hasMany(QuizAttemptAnswer, {
  foreignKey: "attempt_id",
  as: "answers",
});

QuizAttemptAnswer.belongsTo(QuizAttempt, {
  foreignKey: "attempt_id",
  as: "attempt",
});

// 15. QuizQuestion ↔ QuizAttemptAnswers
QuizQuestion.hasMany(QuizAttemptAnswer, {
  foreignKey: "question_id",
  as: "attemptAnswers",
});

QuizAttemptAnswer.belongsTo(QuizQuestion, {
  foreignKey: "question_id",
  as: "question",
});

// 16. QuizOption ↔ QuizAttemptAnswers
QuizOption.hasMany(QuizAttemptAnswer, {
  foreignKey: "selected_option_id",
  as: "selectedInAnswers",
});

QuizAttemptAnswer.belongsTo(QuizOption, {
  foreignKey: "selected_option_id",
  as: "selectedOption",
});

// 17. User ↔ UserDevices
User.hasMany(UserDevice, {
  foreignKey: "user_id",
  as: "devices",
});

UserDevice.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// 18. Session (Lecture) ↔ SessionProgress
const SessionProgress = require("./SessionProgress");
const CourseProgress = require("./CourseProgress");

Lecture.hasMany(SessionProgress, {
  foreignKey: "session_id",
  as: "sessionProgress",
});

SessionProgress.belongsTo(Lecture, {
  foreignKey: "session_id",
  as: "session",
});

// 19. Student (User) ↔ SessionProgress
User.hasMany(SessionProgress, {
  foreignKey: "student_id",
  as: "sessionProgress",
});

SessionProgress.belongsTo(User, {
  foreignKey: "student_id",
  as: "student",
});

// 20. Course ↔ CourseProgress
Course.hasMany(CourseProgress, {
  foreignKey: "course_id",
  as: "courseProgress",
});

CourseProgress.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

// 21. Student (User) ↔ CourseProgress
User.hasMany(CourseProgress, {
  foreignKey: "student_id",
  as: "courseProgress",
});

CourseProgress.belongsTo(User, {
  foreignKey: "student_id",
  as: "student",
});

// 22. Announcement ↔ Course
const Announcement = require("./Announcement");
const Notification = require("./Notification");

Announcement.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

Course.hasMany(Announcement, {
  foreignKey: "course_id",
  as: "announcements",
});

// 23. Announcement ↔ Batch
Announcement.belongsTo(CourseBatch, {
  foreignKey: "batch_id",
  as: "batch",
});

CourseBatch.hasMany(Announcement, {
  foreignKey: "batch_id",
  as: "announcements",
});

// 24. Announcement ↔ Creator / Updater
Announcement.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

Announcement.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updater",
});

User.hasMany(Announcement, {
  foreignKey: "created_by",
  as: "createdAnnouncements",
});

// 25. Notification ↔ User
Notification.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

User.hasMany(Notification, {
  foreignKey: "user_id",
  as: "notifications",
});

// 26. CourseReview ↔ Course & Student (User)
const CourseReview = require("./CourseReview");

Course.hasMany(CourseReview, {
  foreignKey: "course_id",
  as: "reviews",
});

CourseReview.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

User.hasMany(CourseReview, {
  foreignKey: "student_id",
  as: "courseReviews",
});

CourseReview.belongsTo(User, {
  foreignKey: "student_id",
  as: "student",
});

const Setting = require("./Setting");

module.exports = {
  User,
  UserRole,
  Course,
  CourseBatch,
  CourseInstructor,
  CourseStudent,
  CourseModule,
  Lecture,
  LectureNote,
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAttemptAnswer,
  UserDevice,
  SessionProgress,
  CourseProgress,
  Announcement,
  Notification,
  CourseReview,
  Setting,
};