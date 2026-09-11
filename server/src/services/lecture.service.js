const { Course, CourseModule, Lecture, LectureNote, User } = require("../models");

/*
 * Create Lecture / Session
 */
const createLecture = async ({
  moduleId,
  instructorId,
  title,
  description,
  session_type,
  lecture_type,
  status,
  display_order,
  scheduled_at,
  duration_minutes,
  session_url,
  meet_url,
  recording_url,
  recording_provider,
  recording_status,
  userId,
}) => {
  const module = await CourseModule.findByPk(moduleId);

  if (!module) {
    throw new Error("Course module not found");
  }

  const resolvedSessionType = session_type || lecture_type || "LIVE";
  const rawRecordingUrl = recording_url || (resolvedSessionType === "RECORDED" ? (session_url || meet_url) : null);
  const resolvedSessionUrl = resolvedSessionType === "RECORDED" ? null : (session_url || meet_url || null);
  const resolvedRecordingStatus = rawRecordingUrl
    ? (recording_status && recording_status !== "NOT_AVAILABLE" ? recording_status : "AVAILABLE")
    : (recording_status || "NOT_AVAILABLE");

  const lecture = await Lecture.create({
    module_id: moduleId,
    instructor_id: instructorId || null,
    title,
    description: description || null,
    session_type: resolvedSessionType,
    status: status || "DRAFT",
    display_order: display_order ?? 0,
    scheduled_at: scheduled_at || null,
    duration_minutes: duration_minutes || null,
    session_url: resolvedSessionUrl,
    recording_url: rawRecordingUrl || null,
    recording_provider: recording_provider || null,
    recording_status: resolvedRecordingStatus,
    published_at: status === "PUBLISHED" ? new Date() : null,
    created_by: userId || null,
    updated_by: userId || null,
  });

  return getLectureById(lecture.id);
};

/*
 * Get all lectures of a module
 */
const getLecturesByModule = async (moduleId) => {
  const module = await CourseModule.findByPk(moduleId, {
    attributes: ["id"],
    raw: true,
  });

  if (!module) {
    throw new Error("Course module not found");
  }

  return await Lecture.findAll({
    where: {
      module_id: moduleId,
    },
    include: [
      {
        model: LectureNote,
        as: "notes",
      },
      {
        model: User,
        as: "instructor",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
    order: [
      ["display_order", "ASC"],
      ["id", "ASC"],
    ],
  });
};

/*
 * Get single lecture
 */
const getLectureById = async (lectureId) => {
  const lecture = await Lecture.findByPk(lectureId, {
    include: [
      {
        model: CourseModule,
        as: "module",
        attributes: ["id", "course_id", "name", "status"],
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "code", "name", "status"],
          },
        ],
      },
      {
        model: LectureNote,
        as: "notes",
      },
      {
        model: User,
        as: "instructor",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  if (!lecture) {
    throw new Error("Lecture not found");
  }

  return lecture;
};

/*
 * Update Lecture
 */
const updateLecture = async ({
  lectureId,
  instructorId,
  title,
  description,
  session_type,
  lecture_type,
  status,
  display_order,
  scheduled_at,
  duration_minutes,
  session_url,
  meet_url,
  recording_url,
  recording_provider,
  recording_status,
  userId,
}) => {
  const lecture = await Lecture.findByPk(lectureId);

  if (!lecture) {
    throw new Error("Lecture not found");
  }

  if (title !== undefined) {
    lecture.title = title;
  }

  if (description !== undefined) {
    lecture.description = description;
  }

  if (session_type !== undefined || lecture_type !== undefined) {
    lecture.session_type = session_type || lecture_type;
  }

  if (instructorId !== undefined) {
    lecture.instructor_id = instructorId;
  }

  if (status !== undefined) {
    lecture.status = status;
    if (status === "PUBLISHED" && !lecture.published_at) {
      lecture.published_at = new Date();
    }
  }

  if (display_order !== undefined) {
    lecture.display_order = display_order;
  }

  if (scheduled_at !== undefined) {
    lecture.scheduled_at = scheduled_at;
  }

  if (duration_minutes !== undefined) {
    lecture.duration_minutes = duration_minutes;
  }

  const effectiveSessionType = session_type || lecture_type || lecture.session_type;

  if (session_url !== undefined || meet_url !== undefined) {
    lecture.session_url = session_url || meet_url;
  }

  if (recording_url !== undefined) {
    lecture.recording_url = recording_url;
  }

  if (recording_provider !== undefined) {
    lecture.recording_provider = recording_provider;
  }

  if (recording_status !== undefined) {
    lecture.recording_status = recording_status;
  }

  // If lecture is or became RECORDED, ensure recording_url is preserved and session_url is not a live link
  if (effectiveSessionType === "RECORDED") {
    if (!lecture.recording_url && lecture.session_url) {
      lecture.recording_url = lecture.session_url;
    }
    lecture.session_url = null;
    if (lecture.recording_url && (!lecture.recording_status || lecture.recording_status === "NOT_AVAILABLE")) {
      lecture.recording_status = "AVAILABLE";
    }
  }

  lecture.updated_by = userId || null;
  await lecture.save();

  return getLectureById(lecture.id);
};

/*
 * Update status
 */
const updateLectureStatus = async ({ lectureId, status, userId }) => {
  const lecture = await Lecture.findByPk(lectureId);

  if (!lecture) {
    throw new Error("Lecture not found");
  }

  lecture.status = status;

  if (status === "PUBLISHED") {
    lecture.published_at = new Date();
  }

  lecture.updated_by = userId || null;
  await lecture.save();

  return getLectureById(lecture.id);
};

/*
 * Update order
 */
const updateLectureOrder = async ({ lectureId, display_order, userId }) => {
  const lecture = await Lecture.findByPk(lectureId);

  if (!lecture) {
    throw new Error("Lecture not found");
  }

  lecture.display_order = display_order;
  lecture.updated_by = userId || null;

  await lecture.save();

  return getLectureById(lecture.id);
};

/*
 * Delete / cancel lecture
 */
const deleteLecture = async ({ lectureId, userId }) => {
  const lecture = await Lecture.findByPk(lectureId);

  if (!lecture) {
    throw new Error("Lecture not found");
  }

  lecture.status = "CANCELLED";
  lecture.updated_by = userId || null;

  await lecture.save();

  return lecture;
};

module.exports = {
  createLecture,
  getLecturesByModule,
  getLectureById,
  updateLecture,
  updateLectureStatus,
  updateLectureOrder,
  deleteLecture,
};