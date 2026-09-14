const quizService = require("../services/quiz.service");
const courseAccessService = require("../services/courseAccess.service");
const { getSupportedLmsLanguages, fetchAvailableLanguages } = require("../config/judge0Languages");

const getSupportedLanguages = async (req, res) => {
  try {
    const supported = getSupportedLmsLanguages();
    const liveAvailable = await fetchAvailableLanguages().catch(() => []);
    return res.json({
      success: true,
      data: {
        supported_languages: supported,
        all_judge0_languages: liveAvailable,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch languages",
    });
  }
};

const listQuizzes = async (req, res) => {
  try {
    const { sessionId, moduleId, courseId, status, search } = req.query;

    const instructorId = courseAccessService.resolveInstructorId(req);
    let allowedCourseIds = null;
    if (instructorId) {
      allowedCourseIds = await courseAccessService.getInstructorCourseIds(instructorId);
    }

    const quizzes = await quizService.listQuizzes({
      sessionId,
      moduleId,
      courseId,
      status,
      search,
      allowedCourseIds,
      instructorId,
    });
    return res.json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to list quizzes",
    });
  }
};

const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this quiz",
        });
      }
    }

    const quiz = await quizService.getQuizById(Number(quizId), { includeCorrect: true });
    return res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const createQuiz = async (req, res) => {
  try {
    const rawSessionId = req.body.session_id || req.body.sessionId || req.params.sessionId;
    const rawModuleId = req.body.module_id || req.body.moduleId;
    const rawCourseId = req.body.course_id || req.body.courseId;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      if (rawCourseId) {
        const hasAccess = await courseAccessService.hasCourseAccess(req.user, Number(rawCourseId), instructorId);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create assessments for this course",
          });
        }
      } else if (rawModuleId) {
        const hasAccess = await courseAccessService.hasModuleAccess(req.user, Number(rawModuleId), instructorId);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create assessments for this module",
          });
        }
      }
    }

    const quiz = await quizService.createQuiz({
      sessionId: rawSessionId ? Number(rawSessionId) : null,
      moduleId: rawModuleId ? Number(rawModuleId) : null,
      courseId: rawCourseId ? Number(rawCourseId) : null,
      title: req.body.title,
      description: req.body.description,
      instructions: req.body.instructions,
      duration_minutes: req.body.duration_minutes,
      passing_marks: req.body.passing_marks,
      max_attempts: req.body.max_attempts,
      available_from: req.body.available_from,
      available_until: req.body.available_until,
      userId: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully as DRAFT",
      data: quiz,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create quiz",
    });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to edit this quiz",
        });
      }
    }

    const quiz = await quizService.updateQuiz(Number(quizId), req.body, req.user?.id);
    return res.json({
      success: true,
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this quiz",
        });
      }
    }

    const result = await quizService.deleteQuiz(Number(quizId));
    return res.json(result);
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const publishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to publish this quiz",
        });
      }
    }

    const quiz = await quizService.publishQuiz(Number(quizId), req.user?.id);
    return res.json({
      success: true,
      message: "Quiz verified and published successfully",
      data: quiz,
    });
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const closeQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to close this quiz",
        });
      }
    }

    const quiz = await quizService.closeQuiz(Number(quizId), req.user?.id);
    return res.json({
      success: true,
      message: "Quiz closed successfully",
      data: quiz,
    });
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to modify questions for this quiz",
        });
      }
    }

    const question = await quizService.addQuestion({
      quizId: Number(quizId),
      question_type: req.body.question_type,
      question_text: req.body.question_text,
      marks: req.body.marks,
      difficulty: req.body.difficulty,
      explanation: req.body.explanation,
      programming_language: req.body.programming_language,
      starter_code: req.body.starter_code,
      constraints: req.body.constraints,
      expected_output: req.body.expected_output,
      display_order: req.body.display_order,
      userId: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: question,
    });
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await quizService.updateQuestion(Number(questionId), req.body, req.user?.id);
    return res.json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    const status = error.message === "Question not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const result = await quizService.deleteQuestion(Number(questionId));
    return res.json(result);
  } catch (error) {
    const status = error.message === "Question not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const reorderQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to reorder questions for this quiz",
        });
      }
    }

    const { orderList } = req.body;
    const result = await quizService.reorderQuestions(Number(quizId), orderList);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const addOption = async (req, res) => {
  try {
    const { questionId } = req.params;
    const option = await quizService.addOption({
      questionId: Number(questionId),
      option_label: req.body.option_label,
      option_text: req.body.option_text,
      is_correct: req.body.is_correct,
      display_order: req.body.display_order,
      userId: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: "Option added successfully",
      data: option,
    });
  } catch (error) {
    const status = error.message === "Question not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOption = async (req, res) => {
  try {
    const { optionId } = req.params;
    const option = await quizService.updateOption(Number(optionId), req.body, req.user?.id);
    return res.json({
      success: true,
      message: "Option updated successfully",
      data: option,
    });
  } catch (error) {
    const status = error.message === "Option not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteOption = async (req, res) => {
  try {
    const { optionId } = req.params;
    const result = await quizService.deleteOption(Number(optionId));
    return res.json(result);
  } catch (error) {
    const status = error.message === "Option not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view attempts for this quiz",
        });
      }
    }

    const result = await quizService.getQuizAttempts(Number(quizId));
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const getAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const result = await quizService.getAttemptDetails(Number(attemptId));
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.message === "Quiz attempt not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const createQuizFromCsv = async (req, res) => {
  try {
    const rawSessionId = req.body.session_id || req.body.sessionId || req.params.sessionId;
    const rawModuleId = req.body.module_id || req.body.moduleId;
    const rawCourseId = req.body.course_id || req.body.courseId;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      if (rawCourseId) {
        const hasAccess = await courseAccessService.hasCourseAccess(req.user, Number(rawCourseId), instructorId);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create assessments for this course",
          });
        }
      } else if (rawModuleId) {
        const hasAccess = await courseAccessService.hasModuleAccess(req.user, Number(rawModuleId), instructorId);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to create assessments for this module",
          });
        }
      }
    }

    const quiz = await quizService.createQuizFromCsv({
      sessionId: rawSessionId ? Number(rawSessionId) : null,
      moduleId: rawModuleId ? Number(rawModuleId) : null,
      courseId: rawCourseId ? Number(rawCourseId) : null,
      title: req.body.title,
      description: req.body.description,
      instructions: req.body.instructions,
      duration_minutes: req.body.duration_minutes,
      passing_marks: req.body.passing_marks,
      max_attempts: req.body.max_attempts,
      csvContent: req.body.csv_content || req.body.csvContent,
      questions: req.body.questions,
      userId: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: "Test created successfully from CSV",
      data: quiz,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create quiz from CSV",
    });
  }
};

const importQuestionsFromCsv = async (req, res) => {
  try {
    const { quizId } = req.params;

    const instructorId = courseAccessService.resolveInstructorId(req);
    if (instructorId) {
      const hasAccess = await courseAccessService.hasQuizAccess(req.user, Number(quizId), instructorId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to import questions into this quiz",
        });
      }
    }

    const quiz = await quizService.importQuestionsFromCsv(Number(quizId), {
      csvContent: req.body.csv_content || req.body.csvContent,
      questions: req.body.questions,
      userId: req.user?.id,
    });

    return res.json({
      success: true,
      message: "Questions imported successfully from CSV",
      data: quiz,
    });
  } catch (error) {
    const status = error.message === "Quiz not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to import questions from CSV",
    });
  }
};

const getSampleCsv = async (req, res) => {
  try {
    const sample = quizService.getSampleCsvString();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="quiz-template.csv"');
    return res.send(sample);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate sample CSV",
    });
  }
};

module.exports = {
  getSupportedLanguages,
  listQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  closeQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  addOption,
  updateOption,
  deleteOption,
  getQuizAttempts,
  getAttemptDetails,
  createQuizFromCsv,
  importQuestionsFromCsv,
  getSampleCsv,
};
