const { Lecture, LectureNote } = require("../models");

/**
 * Create a new note for a lecture/session
 */
const createNote = async ({
  lectureId,
  title,
  note_type = "PDF",
  file_url,
  external_url,
  display_order = 0,
  status = "ACTIVE",
  userId,
}) => {
  const lecture = await Lecture.findByPk(lectureId);
  if (!lecture) {
    throw new Error("Lecture not found");
  }

  const cleanTitle = (title || "").trim();
  if (!cleanTitle) {
    throw new Error("Note title is required");
  }

  const validTypes = ["PDF", "PPT", "DOC", "EXCEL", "ZIP", "CODE", "LINK", "OTHER"];
  if (note_type && !validTypes.includes(note_type)) {
    throw new Error(`Invalid note type. Allowed: ${validTypes.join(", ")}`);
  }

  if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
    throw new Error("Invalid status. Allowed: ACTIVE, INACTIVE");
  }

  const note = await LectureNote.create({
    session_id: lectureId,
    title: cleanTitle,
    note_type: note_type || "PDF",
    file_url: (file_url || "").trim() || null,
    external_url: (external_url || "").trim() || null,
    display_order: display_order !== undefined && display_order !== "" ? Number(display_order) : 0,
    status: status || "ACTIVE",
    created_by: userId || null,
    updated_by: userId || null,
  });

  return note;
};

/**
 * Get all notes of a lecture
 */
const getNotesByLecture = async (lectureId) => {
  const lecture = await Lecture.findByPk(lectureId, { attributes: ["id"], raw: true });
  if (!lecture) {
    throw new Error("Lecture not found");
  }

  return await LectureNote.findAll({
    where: { session_id: lectureId },
    order: [
      ["display_order", "ASC"],
      ["id", "ASC"],
    ],
  });
};

/**
 * Update an existing note
 */
const updateNote = async (noteId, data, userId) => {
  const note = await LectureNote.findByPk(noteId);
  if (!note) {
    throw new Error("Note not found");
  }

  if (data.title !== undefined) {
    const cleanTitle = (data.title || "").trim();
    if (!cleanTitle) throw new Error("Note title cannot be empty");
    note.title = cleanTitle;
  }

  if (data.note_type !== undefined) {
    const validTypes = ["PDF", "PPT", "DOC", "EXCEL", "ZIP", "CODE", "LINK", "OTHER"];
    if (!validTypes.includes(data.note_type)) {
      throw new Error(`Invalid note type. Allowed: ${validTypes.join(", ")}`);
    }
    note.note_type = data.note_type;
  }

  if (data.file_url !== undefined) {
    note.file_url = (data.file_url || "").trim() || null;
  }

  if (data.external_url !== undefined) {
    note.external_url = (data.external_url || "").trim() || null;
  }

  if (data.display_order !== undefined) {
    note.display_order = Number(data.display_order) || 0;
  }

  if (data.status !== undefined) {
    if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
      throw new Error("Invalid status. Allowed: ACTIVE, INACTIVE");
    }
    note.status = data.status;
  }

  note.updated_by = userId || null;
  await note.save();

  return note;
};

/**
 * Update note status (ACTIVE / INACTIVE)
 */
const updateNoteStatus = async (noteId, status, userId) => {
  const note = await LectureNote.findByPk(noteId);
  if (!note) {
    throw new Error("Note not found");
  }

  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new Error("Invalid note status. Allowed: ACTIVE, INACTIVE");
  }

  note.status = status;
  note.updated_by = userId || null;
  await note.save();

  return note;
};

/**
 * Delete a note
 */
const deleteNote = async (noteId) => {
  const note = await LectureNote.findByPk(noteId);
  if (!note) {
    throw new Error("Note not found");
  }

  await note.destroy();
  return { success: true, message: "Note deleted successfully" };
};

module.exports = {
  createNote,
  getNotesByLecture,
  updateNote,
  updateNoteStatus,
  deleteNote,
};
