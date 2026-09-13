const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  validateCreateCourse,
  validateUpdateCourse,
} = require("../validators/course.validator");

const {
  create,
  getAll,
  getOne,
  update,
  updateStatus,
} = require("../controllers/course.controller");
const courseReviewController = require("../controllers/courseReview.controller");

const router = express.Router();

// Public & Student Course Reviews Summary
router.get("/:courseId/reviews/summary", courseReviewController.getCourseReviewSummary);

// Course Reviews: Admin gets all (including HIDDEN), public/student gets ACTIVE only
router.get("/:courseId/reviews", (req, res, next) => {
  if (req.baseUrl && req.baseUrl.includes("/admin")) {
    return authenticate(req, res, () => {
      return authorizeRoles("ADMIN")(req, res, () => {
        return courseReviewController.getAdminCourseReviews(req, res, next);
      });
    });
  }
  return courseReviewController.getCourseReviews(req, res, next);
});

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "INSTRUCTOR"),
  getAll
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "INSTRUCTOR"),
  getOne
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  validateCreateCourse,
  create
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  validateUpdateCourse,
  update
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN"),
  updateStatus
);

module.exports = router;