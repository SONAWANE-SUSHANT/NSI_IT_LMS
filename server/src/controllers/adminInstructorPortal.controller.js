const { User, UserRole } = require("../models");
const instructorService = require("../services/instructor.service");

/**
 * GET /api/admin/instructors/:id/portal
 * Secure endpoint for Admin to view an instructor's portal context
 */
const getInstructorPortalView = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = parseInt(id, 10);

    if (isNaN(instructorId) || instructorId <= 0) {
      return res.status(404).json({
        success: false,
        message: "Invalid instructor ID",
      });
    }

    const user = await User.findByPk(instructorId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserRole,
          as: "role",
          attributes: ["id", "name"],
        },
      ],
    });

    // 1. Invalid instructor ID / User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // 2. User is not an instructor
    const roleName = user.role?.name || "";
    if (roleName.toUpperCase() !== "INSTRUCTOR" && user.role_id !== 2) {
      return res.status(400).json({
        success: false,
        message: "Selected user is not an instructor",
        data: {
          id: user.id,
          role: roleName,
        },
      });
    }

    // 4. Inactive / Suspended instructor account rules
    if (user.status !== "ACTIVE") {
      return res.status(200).json({
        success: true,
        isActive: false,
        status: user.status,
        message: `Instructor account is currently ${user.status.toLowerCase()}`,
        data: {
          instructor: {
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
        },
      });
    }

    // Active instructor: fetch their batches and teaching stats
    const batches = await instructorService.getMyBatches(instructorId);

    return res.json({
      success: true,
      isActive: true,
      status: user.status,
      data: {
        instructor: {
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
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve instructor portal view",
    });
  }
};

module.exports = {
  getInstructorPortalView,
};
