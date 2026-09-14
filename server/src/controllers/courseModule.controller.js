const courseModuleService = require("../services/courseModule.service");
const courseAccessService = require("../services/courseAccess.service");

const createModule = async (req, res) => {
  try {
    const { courseId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasCourseAccess(req.user, courseId, instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to create modules for this course",
        });
      }
    }

    const module = await courseModuleService.createModule({
      courseId: Number(courseId),
      name: req.body.name || req.body.title,
      title: req.body.title || req.body.name,
      description: req.body.description,
      duration: req.body.duration,
      display_order: req.body.display_order,
      userId: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Course module created successfully",
      data: module,
    });
  } catch (error) {
    console.error("Create module error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getModulesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasCourseAccess(req.user, courseId, instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access modules for this course",
        });
      }
    }

    const modules =
      await courseModuleService.getModulesByCourse(
        Number(courseId)
      );

    return res.status(200).json({
      success: true,
      message: "Course modules fetched successfully",
      data: modules,
    });
  } catch (error) {
    console.error("Get modules error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasModuleAccess(req.user, moduleId, instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this module",
        });
      }
    }

    const module =
      await courseModuleService.getModuleById(
        Number(moduleId)
      );

    return res.status(200).json({
      success: true,
      message: "Course module fetched successfully",
      data: module,
    });
  } catch (error) {
    console.error("Get module error:", error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module =
      await courseModuleService.updateModule({
        moduleId: Number(moduleId),
        name: req.body.name,
        title: req.body.title,
        description: req.body.description,
        duration: req.body.duration,
        display_order: req.body.display_order,
        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Course module updated successfully",
      data: module,
    });
  } catch (error) {
    console.error("Update module error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateModuleStatus = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module =
      await courseModuleService.updateModuleStatus({
        moduleId: Number(moduleId),
        status: req.body.status,
        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Course module status updated successfully",
      data: module,
    });
  } catch (error) {
    console.error("Update module status error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateModuleOrder = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module =
      await courseModuleService.updateModuleOrder({
        moduleId: Number(moduleId),
        display_order: req.body.display_order,
        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Course module order updated successfully",
      data: module,
    });
  } catch (error) {
    console.error("Update module order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module =
      await courseModuleService.deleteModule({
        moduleId: Number(moduleId),
        userId: req.user?.id || null,
      });

    return res.status(200).json({
      success: true,
      message: "Course module archived successfully",
      data: module,
    });
  } catch (error) {
    console.error("Delete module error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  updateModuleStatus,
  updateModuleOrder,
  deleteModule,
};