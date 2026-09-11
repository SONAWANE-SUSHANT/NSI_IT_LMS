const express = require("express");

const router = express.Router();

const lectureController = require("../controllers/lecture.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  validateCreateLecture,
  validateUpdateLecture,
  validateLectureId,
  validateModuleId,
  validateLectureStatus,
  validateLectureOrder,
} = require("../validators/lecture.validator");

const auth = [authenticate, authorizeRoles("ADMIN", "INSTRUCTOR")];

/*
 * Create lecture
 */
router.post(
  "/modules/:moduleId/lectures",
  auth,
  validateModuleId,
  validateCreateLecture,
  lectureController.createLecture
);

/*
 * Get all lectures of a module
 */
router.get(
  "/modules/:moduleId/lectures",
  auth,
  validateModuleId,
  lectureController.getLecturesByModule
);

/*
 * Get single lecture
 */
router.get(
  "/lectures/:lectureId",
  auth,
  validateLectureId,
  lectureController.getLectureById
);

/*
 * Update lecture
 */
router.put(
  "/lectures/:lectureId",
  auth,
  validateLectureId,
  validateUpdateLecture,
  lectureController.updateLecture
);

/*
 * Update lecture status
 */
router.patch(
  "/lectures/:lectureId/status",
  auth,
  validateLectureId,
  validateLectureStatus,
  lectureController.updateLectureStatus
);

/*
 * Update lecture order
 */
router.patch(
  "/lectures/:lectureId/order",
  auth,
  validateLectureId,
  validateLectureOrder,
  lectureController.updateLectureOrder
);

/*
 * Archive lecture
 */
router.delete(
  "/lectures/:lectureId",
  auth,
  validateLectureId,
  lectureController.deleteLecture
);

module.exports = router;