const notificationService = require("../services/notification.service");

/**
 * GET /api/student/notifications or /api/notifications
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: page || 1,
      limit: limit || 20,
      unreadOnly: unreadOnly === "true",
    });

    return res.json({
      success: true,
      data: result.notifications,
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
 * GET /api/student/notifications/unread-count or /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    return res.json({
      success: true,
      data: {
        unread_count: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH or PUT /api/student/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const data = await notificationService.markNotificationAsRead(userId, notificationId);
    return res.json({
      success: true,
      message: "Notification marked as read",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH or PUT /api/student/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllNotificationsAsRead(userId);
    return res.json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
