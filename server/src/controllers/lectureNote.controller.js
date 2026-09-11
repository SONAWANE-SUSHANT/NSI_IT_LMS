const lectureNoteService = require("../services/lectureNote.service");

const createNote = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const note = await lectureNoteService.createNote({
      lectureId: Number(lectureId),
      title: req.body.title,
      note_type: req.body.note_type,
      file_url: req.body.file_url,
      external_url: req.body.external_url,
      display_order: req.body.display_order,
      status: req.body.status,
      userId: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Lecture note created successfully",
      data: note,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create note",
    });
  }
};

const getNotesByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const notes = await lectureNoteService.getNotesByLecture(Number(lectureId));

    return res.status(200).json({
      success: true,
      message: "Lecture notes fetched successfully",
      data: notes,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch notes",
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await lectureNoteService.updateNote(
      Number(noteId),
      req.body,
      req.user?.id || null
    );

    return res.status(200).json({
      success: true,
      message: "Lecture note updated successfully",
      data: note,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update note",
    });
  }
};

const updateNoteStatus = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { status } = req.body;
    const note = await lectureNoteService.updateNoteStatus(
      Number(noteId),
      status,
      req.user?.id || null
    );

    return res.status(200).json({
      success: true,
      message: "Lecture note status updated successfully",
      data: note,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update note status",
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const result = await lectureNoteService.deleteNote(Number(noteId));

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete note",
    });
  }
};

module.exports = {
  createNote,
  getNotesByLecture,
  updateNote,
  updateNoteStatus,
  deleteNote,
};
