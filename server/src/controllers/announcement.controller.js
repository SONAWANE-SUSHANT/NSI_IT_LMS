const announcementService = require("../services/announcement.service");

/**
 * POST /api/admin/announcements or /api/instructor/announcements
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const data = await announcementService.createAnnouncement(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/announcements
 */
const getAdminAnnouncements = async (req, res, next) => {
  try {
    const result = await announcementService.getAdminAnnouncements(req.query);
    return res.json({
      success: true,
      data: result.announcements,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.total_pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/instructor/announcements
 */
const getInstructorAnnouncements = async (req, res, next) => {
  try {
    const result = await announcementService.getInstructorAnnouncements(req.user.id, req.query);
    return res.json({
      success: true,
      data: result.announcements,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.total_pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/announcements/:id or /api/instructor/announcements/:id
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await announcementService.getAnnouncementById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    if (req.user.role === "INSTRUCTOR") {
      await announcementService.verifyInstructorScope(
        req.user.id,
        announcement.course_id,
        announcement.batch_id
      );
    }

    return res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/announcements/:id or /api/instructor/announcements/:id
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const data = await announcementService.updateAnnouncement(req.params.id, req.body, req.user);
    return res.json({
      success: true,
      message: "Announcement updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/announcements/:id/publish or /api/instructor/announcements/:id/publish
 */
const publishAnnouncement = async (req, res, next) => {
  try {
    const data = await announcementService.publishAnnouncement(req.params.id, req.user);
    return res.json({
      success: true,
      message: "Announcement published successfully and notifications sent",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/announcements/:id/archive or /api/instructor/announcements/:id/archive
 */
const archiveAnnouncement = async (req, res, next) => {
  try {
    const data = await announcementService.archiveAnnouncement(req.params.id, req.user);
    return res.json({
      success: true,
      message: "Announcement archived successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/announcements/:id
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const result = await announcementService.deleteAnnouncement(req.params.id, req.user);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/announcements
 */
const getStudentAnnouncements = async (req, res, next) => {
  try {
    const data = await announcementService.getStudentAnnouncements(req.user.id);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/announcements/:id
 */
const getStudentAnnouncementById = async (req, res, next) => {
  try {
    const data = await announcementService.getStudentAnnouncementById(req.user.id, req.params.id);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAdminAnnouncements,
  getInstructorAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  getStudentAnnouncements,
  getStudentAnnouncementById,
};
