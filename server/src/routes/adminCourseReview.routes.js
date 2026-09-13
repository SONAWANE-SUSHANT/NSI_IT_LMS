const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const courseReviewController = require("../controllers/courseReview.controller");

const router = express.Router();

// Admin Review Moderation routes
router.use(authenticate, authorizeRoles("ADMIN"));

// GET /api/admin/courses/:courseId/reviews
router.get("/courses/:courseId/reviews", courseReviewController.getAdminCourseReviews);

// PATCH & PUT /api/admin/reviews/:reviewId/hide
router.patch("/reviews/:reviewId/hide", courseReviewController.hideReview);
router.put("/reviews/:reviewId/hide", courseReviewController.hideReview);

// PATCH & PUT /api/admin/reviews/:reviewId/restore
router.patch("/reviews/:reviewId/restore", courseReviewController.restoreReview);
router.put("/reviews/:reviewId/restore", courseReviewController.restoreReview);

module.exports = router;
