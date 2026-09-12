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
};