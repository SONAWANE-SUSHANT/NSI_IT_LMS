const { Op } = require("sequelize");
const { Notification, CourseStudent, CourseBatch, User, UserRole } = require("../models");

/**
 * Create a single notification for a user
 */
const createNotification = async (
  { user_id, title, message, notification_type = "GENERAL", reference_type = null, reference_id = null },
  transaction = null
) => {
  // Prevent duplicate if reference is provided
  if (reference_type && reference_id) {
    const existing = await Notification.findOne({
      where: {
        user_id,
        notification_type,
        reference_type,
        reference_id,
      },
      transaction,
    });
    if (existing) {
      return existing;
    }
  }

  return await Notification.create(
    {
      user_id,
      title,
      message,
      notification_type,
      reference_type,
      reference_id,
      is_read: false,
      read_at: null,
    },
    { transaction }
  );
};

/**
 * Bulk create notifications for multiple users with duplicate prevention
 */
const createNotificationsForUsers = async (
  userIds = [],
  { title, message, notification_type = "GENERAL", reference_type = null, reference_id = null },
  transaction = null
) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueUserIds.length === 0) return [];

  let targetUserIds = uniqueUserIds;

  // Filter out any users who already received a notification for this reference
  if (reference_type && reference_id) {
    const existing = await Notification.findAll({
      where: {
        user_id: { [Op.in]: uniqueUserIds },
        notification_type,
        reference_type,
        reference_id,
      },
      attributes: ["user_id"],
      transaction,
    });
    const existingUserIds = new Set(existing.map((n) => n.user_id));
    targetUserIds = uniqueUserIds.filter((id) => !existingUserIds.has(id));
  }

  if (targetUserIds.length === 0) return [];

  const records = targetUserIds.map((userId) => ({
    user_id: userId,
    title,
    message,
    notification_type,
    reference_type,
    reference_id,
    is_read: false,
    read_at: null,
  }));

  return await Notification.bulkCreate(records, { transaction });
};

/**
 * Create notifications for all students targeted by an announcement
 */
const createAnnouncementNotifications = async (announcement, transaction = null) => {
  if (!announcement || announcement.status !== "PUBLISHED") return [];

  let recipientIds = [];

  if (announcement.batch_id) {
    // Specific batch: target active students in this batch
    const enrollments = await CourseStudent.findAll({
      where: {
        batch_id: announcement.batch_id,
        status: "ACTIVE",
      },
      attributes: ["student_id"],
      transaction,
    });
    recipientIds = enrollments.map((e) => e.student_id);
  } else if (announcement.course_id) {
    // Specific course: target active students across all batches in this course
    const batches = await CourseBatch.findAll({
      where: { course_id: announcement.course_id },
      attributes: ["id"],
      transaction,
    });
    const batchIds = batches.map((b) => b.id);
    if (batchIds.length > 0) {
      const enrollments = await CourseStudent.findAll({
        where: {
          batch_id: { [Op.in]: batchIds },
          status: "ACTIVE",
        },
        attributes: ["student_id"],
        transaction,
      });
      recipientIds = enrollments.map((e) => e.student_id);
    }
  } else {
    // Global announcement: target all active students
    let studentRoleId = 3; // Standard fallback
    try {
      const role = await UserRole.findOne({
        where: { name: "STUDENT" },
        attributes: ["id"],
        transaction,
      });
      if (role) studentRoleId = role.id;
    } catch {
      // Use fallback role_id 3
    }

    const students = await User.findAll({
      where: {
        role_id: studentRoleId,
        status: "ACTIVE",
      },
      attributes: ["id"],
      transaction,
    });
    recipientIds = students.map((s) => s.id);
  }

  return await createNotificationsForUsers(
    recipientIds,
    {
      title: announcement.title,
      message: announcement.message,
      notification_type: "ANNOUNCEMENT",
      reference_type: "ANNOUNCEMENT",
      reference_id: announcement.id,
    },
    transaction
  );
};

/**
 * Get paginated or full notification list for a user
 */
const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const where = { user_id: userId };
  if (unreadOnly) {
    where.is_read = false;
  }

  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: Number(limit),
    offset: Number(offset),
  });

  return {
    notifications: rows,
    total: count,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(count / Number(limit)) || 1,
  };
};

/**
 * Get count of unread notifications for a user
 */
const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });
  return count;
};

/**
 * Mark a single notification as read by user
 */
const markNotificationAsRead = async (userId, notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    const error = new Error("Notification not found");
    error.status = 404;
    throw error;
  }

  if (notification.user_id !== Number(userId)) {
    const error = new Error("You are not authorized to access this notification");
    error.status = 403;
    throw error;
  }

  if (!notification.is_read) {
    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();
  }

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllNotificationsAsRead = async (userId) => {
  const [affectedCount] = await Notification.update(
    {
      is_read: true,
      read_at: new Date(),
    },
    {
      where: {
        user_id: userId,
        is_read: false,
      },
    }
  );

  return { affectedCount };
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
  createAnnouncementNotifications,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
