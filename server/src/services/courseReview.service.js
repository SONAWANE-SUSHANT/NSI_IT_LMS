const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  CourseReview,
  Course,
  CourseBatch,
  CourseStudent,
  CourseInstructor,
  User,
} = require("../models");

/**
 * Validate that a rating is strictly an integer between 1 and 5
 */
const validateRating = (rating) => {
  if (rating === null || rating === undefined || typeof rating === "boolean") {
    const error = new Error("Rating is required and must be an integer between 1 and 5");
    error.status = 400;
    throw error;
  }
  const num = Number(rating);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    const error = new Error("Rating must be an integer between 1 and 5");
    error.status = 400;
    throw error;
  }
  return num;
};

/**
 * Validate review text: optional, trimmed, max 5000 chars, no whitespace-only strings
 */
const validateReviewText = (review) => {
  if (review === undefined || review === null) {
    return null;
  }
  if (typeof review !== "string") {
    const error = new Error("Review text must be a string");
    error.status = 400;
    throw error;
  }
  if (review.length > 0 && review.trim().length === 0) {
    const error = new Error("Review cannot be whitespace only");
    error.status = 400;
    throw error;
  }
  const trimmed = review.trim();
  if (trimmed.length > 5000) {
    const error = new Error("Review text cannot exceed 5000 characters");
    error.status = 400;
    throw error;
  }
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Helper: Verify course exists
 */
const verifyCourseExists = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    const error = new Error("Course not found");
    error.status = 404;
    throw error;
  }
  return course;
};

/**
 * Helper: Verify that student is actively enrolled in the course
 */
const verifyStudentEnrollment = async (studentId, courseId) => {
  await verifyCourseExists(courseId);

  const batches = await CourseBatch.findAll({
    where: { course_id: courseId },
    attributes: ["id"],
  });
  const batchIds = batches.map((b) => b.id);

  if (!batchIds.length) {
    const error = new Error("You must be enrolled in this course to leave a review");
    error.status = 403;
    throw error;
  }

  const enrollment = await CourseStudent.findOne({
    where: {
      student_id: studentId,
      batch_id: { [Op.in]: batchIds },
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    const error = new Error("You must be enrolled in this course to leave a review");
    error.status = 403;
    throw error;
  }

  return enrollment;
};

/**
 * Create a new review for an enrolled student
 */
const createReview = async (courseId, studentId, { rating, review }) => {
  // 1. Verify course & student enrollment
  await verifyStudentEnrollment(studentId, courseId);

  // 2. Validate rating
  const validRating = validateRating(rating);

  // 3. Validate review text
  const cleanReview = validateReviewText(review);

  // 4. Check for existing review (enforce 1 review per student per course)
  const existingReview = await CourseReview.findOne({
    where: {
      course_id: courseId,
      student_id: studentId,
    },
  });

  if (existingReview) {
    const error = new Error("Student has already reviewed this course.");
    error.status = 409;
    throw error;
  }

  // 5. Create review with status ACTIVE
  try {
    const newReview = await CourseReview.create({
      course_id: courseId,
      student_id: studentId,
      rating: validRating,
      review: cleanReview,
      status: "ACTIVE",
    });

    return newReview;
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const error = new Error("Student has already reviewed this course.");
      error.status = 409;
      throw error;
    }
    throw err;
  }
};

/**
 * Get the authenticated student's own review for a course
 */
const getMyReview = async (courseId, studentId) => {
  await verifyCourseExists(courseId);

  const review = await CourseReview.findOne({
    where: {
      course_id: courseId,
      student_id: studentId,
    },
  });

  return review;
};

/**
 * Update authenticated student's own review
 */
const updateMyReview = async (courseId, studentId, { rating, review }) => {
  // Verify student enrollment
  await verifyStudentEnrollment(studentId, courseId);

  const reviewRecord = await CourseReview.findOne({
    where: {
      course_id: courseId,
      student_id: studentId,
    },
  });

  if (!reviewRecord) {
    const error = new Error("Review not found for this course");
    error.status = 404;
    throw error;
  }

  const validRating = validateRating(rating);
  const cleanReview = validateReviewText(review);

  reviewRecord.rating = validRating;
  reviewRecord.review = cleanReview;
  await reviewRecord.save();

  return reviewRecord;
};

/**
 * Delete authenticated student's own review
 */
const deleteMyReview = async (courseId, studentId) => {
  await verifyCourseExists(courseId);

  const reviewRecord = await CourseReview.findOne({
    where: {
      course_id: courseId,
      student_id: studentId,
    },
  });

  if (!reviewRecord) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  await reviewRecord.destroy();
  return { message: "Review deleted successfully" };
};

/**
 * Get public course reviews (ACTIVE only, safe student info)
 */
const getCourseReviews = async (courseId, { page = 1, limit = 10 } = {}) => {
  await verifyCourseExists(courseId);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await CourseReview.findAndCountAll({
    where: {
      course_id: courseId,
      status: "ACTIVE",
    },
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "first_name", "last_name"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: limitNum,
    offset,
  });

  return {
    reviews: rows,
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum) || 1,
  };
};

/**
 * Get course review summary & rating distribution (ACTIVE reviews only)
 */
const getCourseReviewSummary = async (courseId) => {
  await verifyCourseExists(courseId);

  // 1. Total and Average
  const stats = await CourseReview.findOne({
    where: {
      course_id: courseId,
      status: "ACTIVE",
    },
    attributes: [
      [sequelize.fn("COUNT", sequelize.col("id")), "total_reviews"],
      [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
    ],
    raw: true,
  });

  const totalReviews = parseInt(stats?.total_reviews, 10) || 0;
  const avgRating = totalReviews > 0 ? parseFloat(Number(stats?.average_rating).toFixed(2)) : 0;

  // 2. Rating distribution (group by rating)
  const distributionRaw = await CourseReview.findAll({
    where: {
      course_id: courseId,
      status: "ACTIVE",
    },
    attributes: [
      "rating",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["rating"],
    raw: true,
  });

  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  distributionRaw.forEach((item) => {
    if (ratingDistribution[item.rating] !== undefined) {
      ratingDistribution[item.rating] = parseInt(item.count, 10) || 0;
    }
  });

  return {
    average_rating: avgRating,
    total_reviews: totalReviews,
    rating_distribution: ratingDistribution,
  };
};

/**
 * Admin: Get all reviews for a course (ACTIVE + HIDDEN)
 */
const getAdminCourseReviews = async (courseId, { status, page = 1, limit = 20 } = {}) => {
  await verifyCourseExists(courseId);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = { course_id: courseId };
  if (status && ["ACTIVE", "HIDDEN"].includes(status)) {
    whereClause.status = status;
  }

  const { count, rows } = await CourseReview.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: "student",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: limitNum,
    offset,
  });

  return {
    reviews: rows,
    total: count,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(count / limitNum) || 1,
  };
};

/**
 * Admin: Hide a review
 */
const hideReview = async (reviewId) => {
  const review = await CourseReview.findByPk(reviewId);
  if (!review) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  review.status = "HIDDEN";
  await review.save();
  return review;
};

/**
 * Admin: Restore a hidden review
 */
const restoreReview = async (reviewId) => {
  const review = await CourseReview.findByPk(reviewId);
  if (!review) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  review.status = "ACTIVE";
  await review.save();
  return review;
};

/**
 * Instructor: View reviews for assigned course
 */
const getInstructorCourseReviews = async (courseId, instructorId, { page = 1, limit = 20 } = {}) => {
  await verifyCourseExists(courseId);

  // Check if instructor is assigned to any batch of this course
  const batches = await CourseBatch.findAll({
    where: { course_id: courseId },
    attributes: ["id"],
  });
  const batchIds = batches.map((b) => b.id);

  if (!batchIds.length) {
    const error = new Error("You are not assigned as an instructor to this course");
    error.status = 403;
    throw error;
  }

  const assignment = await CourseInstructor.findOne({
    where: {
      instructor_id: instructorId,
      batch_id: { [Op.in]: batchIds },
      status: "ACTIVE",
    },
  });

  if (!assignment) {
    const error = new Error("You are not assigned as an instructor to this course");
    error.status = 403;
    throw error;
  }

  // Authorized instructor: return course reviews
  return await getCourseReviews(courseId, { page, limit });
};

module.exports = {
  validateRating,
  validateReviewText,
  verifyCourseExists,
  verifyStudentEnrollment,
  createReview,
  getMyReview,
  updateMyReview,
  deleteMyReview,
  getCourseReviews,
  getCourseReviewSummary,
  getAdminCourseReviews,
  hideReview,
  restoreReview,
  getInstructorCourseReviews,
};
