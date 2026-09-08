const {
  Course,
  CourseBatch,
  CourseInstructor,
  User,
  UserRole,
} = require("../models");

const assignInstructor = async (batchId, instructorId, adminId) => {
  const batch = await CourseBatch.findByPk(batchId);

  if (!batch) {
    throw new Error("Batch not found");
  }

  const instructor = await User.findByPk(instructorId, {
    include: [
      {
        model: UserRole,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!instructor) {
    throw new Error("Instructor user not found");
  }

  if (!instructor.role || instructor.role.name !== "INSTRUCTOR") {
    throw new Error("Selected user does not have INSTRUCTOR role");
  }

  if (instructor.status !== "ACTIVE") {
    throw new Error("Instructor account is not active");
  }

  const existingAssignment = await CourseInstructor.findOne({
    where: {
      batch_id: batchId,
      instructor_id: instructorId,
    },
  });

  if (existingAssignment) {
    if (existingAssignment.status === "ACTIVE") {
      throw new Error("Instructor is already assigned to this batch");
    }

    existingAssignment.status = "ACTIVE";
    existingAssignment.updated_by = adminId;

    await existingAssignment.save();

    return getInstructorAssignmentById(existingAssignment.id);
  }

  const assignment = await CourseInstructor.create({
    batch_id: batchId,
    instructor_id: instructorId,
    status: "ACTIVE",
    assigned_at: new Date(),
    assigned_by: adminId,
    updated_by: adminId,
  });

  return getInstructorAssignmentById(assignment.id);
};

const getInstructorAssignments = async (batchId) => {
  const batch = await CourseBatch.findByPk(batchId);

  if (!batch) {
    throw new Error("Batch not found");
  }

  return CourseInstructor.findAll({
    where: {
      batch_id: batchId,
    },
    include: [
      {
        model: User,
        as: "instructor",
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
    order: [["assigned_at", "DESC"]],
  });
};

const getInstructorAssignmentById = async (id) => {
  const assignment = await CourseInstructor.findByPk(id, {
    include: [
      {
        model: User,
        as: "instructor",
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

  if (!assignment) {
    throw new Error("Instructor assignment not found");
  }

  return assignment;
};

const updateInstructorAssignmentStatus = async (
  batchId,
  instructorId,
  status,
  adminId
) => {
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new Error("Invalid assignment status");
  }

  const assignment = await CourseInstructor.findOne({
    where: {
      batch_id: batchId,
      instructor_id: instructorId,
    },
  });

  if (!assignment) {
    throw new Error("Instructor assignment not found");
  }

  assignment.status = status;
  assignment.updated_by = adminId;

  await assignment.save();

  return getInstructorAssignmentById(assignment.id);
};

const removeInstructor = async (batchId, instructorId, adminId) => {
  const assignment = await CourseInstructor.findOne({
    where: {
      batch_id: batchId,
      instructor_id: instructorId,
    },
  });

  if (!assignment) {
    throw new Error("Instructor assignment not found");
  }

  assignment.status = "INACTIVE";
  assignment.updated_by = adminId;

  await assignment.save();

  return assignment;
};

module.exports = {
  assignInstructor,
  getInstructorAssignments,
  getInstructorAssignmentById,
  updateInstructorAssignmentStatus,
  removeInstructor,
};