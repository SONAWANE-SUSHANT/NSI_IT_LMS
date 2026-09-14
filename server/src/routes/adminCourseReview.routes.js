const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const courseReviewController = require("../controllers/courseReview.controller");

const router = express.Router();

const adminAuth = [authenticate, authorizeRoles("ADMIN")];

// GET /api/admin/courses/:courseId/reviews
router.get("/courses/:courseId/reviews", ...adminAuth, courseReviewController.getAdminCourseReviews);

// PATCH & PUT /api/admin/reviews/:reviewId/hide
router.patch("/reviews/:reviewId/hide", ...adminAuth, courseReviewController.hideReview);
router.put("/reviews/:reviewId/hide", ...adminAuth, courseReviewController.hideReview);

// PATCH & PUT /api/admin/reviews/:reviewId/restore
router.patch("/reviews/:reviewId/restore", ...adminAuth, courseReviewController.restoreReview);
router.put("/reviews/:reviewId/restore", ...adminAuth, courseReviewController.restoreReview);

module.exports = router;
