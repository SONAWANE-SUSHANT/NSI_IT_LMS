const {
  Course,
  CourseBatch,
  CourseStudent,
  User,
  UserRole,
} = require("../models");

const enrollStudent = async (batchId, studentId, adminId) => {
  const batch = await CourseBatch.findByPk(batchId);

  if (!batch) {
    throw new Error("Batch not found");
  }

  const student = await User.findByPk(studentId, {
    include: [
      {
        model: UserRole,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!student) {
    throw new Error("Student user not found");
  }

  if (!student.role || student.role.name !== "STUDENT") {
    throw new Error("Selected user does not have STUDENT role");
  }

  if (student.status !== "ACTIVE") {
    throw new Error("Student account is not active");
  }

  const existingEnrollment = await CourseStudent.findOne({
    where: {
      batch_id: batchId,
      student_id: studentId,
    },
  });

  if (existingEnrollment) {
    if (existingEnrollment.status === "ACTIVE") {
      throw new Error("Student is already enrolled in this batch");
    }

    existingEnrollment.status = "ACTIVE";
    existingEnrollment.enrollment_date = new Date();
    existingEnrollment.completion_date = null;
    existingEnrollment.updated_by = adminId;

    await existingEnrollment.save();

    return getEnrollmentById(existingEnrollment.id);
  }

  const enrollment = await CourseStudent.create({
    batch_id: batchId,
    student_id: studentId,
    status: "ACTIVE",
    enrollment_date: new Date(),
    created_by: adminId,
    updated_by: adminId,
  });

  return getEnrollmentById(enrollment.id);
};

const getStudentsByBatch = async (batchId) => {
  const batch = await CourseBatch.findByPk(batchId);

  if (!batch) {
    throw new Error("Batch not found");
  }

  return CourseStudent.findAll({
    where: {
      batch_id: batchId,
    },
    include: [
      {
        model: User,
        as: "student",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
          "username",
          "status",
        ],
        include: [
          {
            model: UserRole,
            as: "role",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: CourseBatch,
        as: "batch",
        attributes: ["id", "batch_code", "name"],
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "code", "name"],
          },
        ],
      },
    ],
    order: [["enrollment_date", "DESC"]],
  });
};

const getEnrollmentById = async (id) => {
  const enrollment = await CourseStudent.findByPk(id, {
    include: [
      {
        model: User,
        as: "student",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "email",
          "username",
          "status",
        ],
        include: [
          {
            model: UserRole,
            as: "role",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: CourseBatch,
        as: "batch",
        attributes: ["id", "batch_code", "name"],
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "code", "name"],
          },
        ],
      },
    ],
  });

  if (!enrollment) {
    throw new Error("Student enrollment not found");
  }

  return enrollment;
};

const updateEnrollmentStatus = async (
  batchId,
  studentId,
  status,
  adminId
) => {
  const allowedStatuses = ["ACTIVE", "INACTIVE", "COMPLETED", "DROPPED"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid enrollment status. Allowed: ACTIVE, INACTIVE, COMPLETED, DROPPED");
  }

  const enrollment = await CourseStudent.findOne({
    where: {
      batch_id: batchId,
      student_id: studentId,
    },
  });

  if (!enrollment) {
    throw new Error("Student enrollment not found");
  }

  enrollment.status = status;
  enrollment.updated_by = adminId;

  if (status === "COMPLETED") {
    enrollment.completion_date = new Date();
  }

  if (status === "ACTIVE") {
    enrollment.completion_date = null;
    enrollment.enrollment_date = enrollment.enrollment_date || new Date();
  }

  await enrollment.save();

  return getEnrollmentById(enrollment.id);
};

const removeStudent = async (batchId, studentId, adminId) => {
  const enrollment = await CourseStudent.findOne({
    where: {
      batch_id: batchId,
      student_id: studentId,
    },
  });

  if (!enrollment) {
    throw new Error("Student enrollment not found");
  }

  enrollment.status = "INACTIVE";
  enrollment.updated_by = adminId;

  await enrollment.save();

  return enrollment;
};

module.exports = {
  enrollStudent,
  getStudentsByBatch,
  getEnrollmentById,
  updateEnrollmentStatus,
  removeStudent,
};