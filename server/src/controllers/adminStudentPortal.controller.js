const { User, UserRole } = require("../models");
const studentService = require("../services/student.service");

/**
 * GET /api/admin/students/:id/portal
 * Secure endpoint for Admin to view a student's portal context
 */
const getStudentPortalView = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id, 10);

    if (isNaN(studentId) || studentId <= 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const user = await User.findByPk(studentId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserRole,
          as: "role",
          attributes: ["id", "name"],
        },
      ],
    });

    // 1. Invalid student ID / User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // 2. User is not a student
    const roleName = user.role?.name || "";
    if (roleName.toUpperCase() !== "STUDENT" && user.role_id !== 3) {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a student",
        data: {
          id: user.id,
          role: roleName,
        },
      });
    }

    // 4. Inactive / Suspended student account rules
    if (user.status !== "ACTIVE") {
      return res.status(200).json({
        success: true,
        isActive: false,
        status: user.status,
        message: `Student account is currently ${user.status.toLowerCase()}`,
        data: {
          student: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            username: user.username,
            role: roleName,
            status: user.status,
            photo: user.photo,
            contact_no: user.contact_no,
          },
          batches: [],
          upcomingSessions: [],
        },
      });
    }

    // Active student: fetch enrolled batches and upcoming sessions
    const [batches, upcomingSessions] = await Promise.all([
      studentService.getMyBatches(studentId),
      studentService.getMyUpcomingSessions(studentId),
    ]);

    return res.json({
      success: true,
      isActive: true,
      status: user.status,
      data: {
        student: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          username: user.username,
          role: roleName,
          status: user.status,
          photo: user.photo,
          contact_no: user.contact_no,
          gender: user.gender,
          created_at: user.created_at,
        },
        batches,
        upcomingSessions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve student portal view",
    });
  }
};

module.exports = {
  getStudentPortalView,
};
