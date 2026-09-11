const express = require("express");

const router = express.Router();

const lectureNoteController = require("../controllers/lectureNote.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const auth = [authenticate, authorizeRoles("ADMIN", "INSTRUCTOR")];

// Create note for a lecture
router.post("/lectures/:lectureId/notes", auth, lectureNoteController.createNote);

// Get all notes for a lecture
router.get("/lectures/:lectureId/notes", auth, lectureNoteController.getNotesByLecture);

// Update note
router.put("/notes/:noteId", auth, lectureNoteController.updateNote);

// Update note status (ACTIVE / INACTIVE)
router.patch("/notes/:noteId/status", auth, lectureNoteController.updateNoteStatus);

// Delete note
router.delete("/notes/:noteId", auth, lectureNoteController.deleteNote);

module.exports = router;
