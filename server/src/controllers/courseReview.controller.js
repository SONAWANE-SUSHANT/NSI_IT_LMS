const courseReviewService = require("../services/courseReview.service");

/**
 * POST /api/student/courses/:courseId/reviews
 */
const createReview = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.id;
    const { rating, review } = req.body;

    const data = await courseReviewService.createReview(courseId, studentId, {
      rating,
      review,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/courses/:courseId/reviews/me
 */
const getMyReview = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.id;

    const review = await courseReviewService.getMyReview(courseId, studentId);

    if (!review) {
      return res.json({
        success: true,
        message: "NOT_REVIEWED",
        data: null,
      });
    }

    return res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT/PATCH /api/student/courses/:courseId/reviews/me
 */
const updateMyReview = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.id;
    const { rating, review } = req.body;

    const updated = await courseReviewService.updateMyReview(courseId, studentId, {
      rating,
      review,
    });

    return res.json({
      success: true,
      message: "Review updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/student/courses/:courseId/reviews/me
 */
const deleteMyReview = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.id;

    const result = await courseReviewService.deleteMyReview(courseId, studentId);

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/courses/:courseId/reviews
 */
const getCourseReviews = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { page, limit } = req.query;

    const result = await courseReviewService.getCourseReviews(courseId, {
      page,
      limit,
    });

    return res.json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/courses/:courseId/reviews/summary
 */
const getCourseReviewSummary = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const summary = await courseReviewService.getCourseReviewSummary(courseId);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/courses/:courseId/reviews
 */
const getAdminCourseReviews = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { status, page, limit } = req.query;

    const result = await courseReviewService.getAdminCourseReviews(courseId, {
      status,
      page,
      limit,
    });

    return res.json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH/PUT /api/admin/reviews/:reviewId/hide
 */
const hideReview = async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId || req.params.id;
    const review = await courseReviewService.hideReview(reviewId);

    return res.json({
      success: true,
      message: "Review hidden successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH/PUT /api/admin/reviews/:reviewId/restore
 */
const restoreReview = async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId || req.params.id;
    const review = await courseReviewService.restoreReview(reviewId);

    return res.json({
      success: true,
      message: "Review restored successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/instructor/courses/:courseId/reviews
 */
const getInstructorCourseReviews = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const instructorId = req.user.id;
    const { page, limit } = req.query;

    const result = await courseReviewService.getInstructorCourseReviews(
      courseId,
      instructorId,
      { page, limit }
    );

    return res.json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
