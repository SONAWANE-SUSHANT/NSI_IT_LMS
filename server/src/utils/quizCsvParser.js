/**
 * Server-side CSV parser and validator for Quizzes and Tests
 * Supports RFC 4180 rules (quotes, commas, line breaks, BOM)
 */

function parseCsvTokens(text) {
  const clean = (text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let currentRow = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentVal += '"';
        i += 1; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      currentRow.push(currentVal.trim());
      currentVal = "";
      // Only push non-empty rows
      if (currentRow.some((col) => col !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((col) => col !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Maps raw header text to normalized key
 */
function normalizeHeaderKey(rawHeader) {
  const h = (rawHeader || "").toLowerCase().replace(/[\s_-]+/g, "");
  switch (h) {
    case "question":
    case "questiontext":
    case "prompt":
    case "title":
      return "question_text";

    case "questiontype":
    case "type":
      return "question_type";

    case "marks":
    case "mark":
    case "points":
    case "score":
      return "marks";

    case "difficulty":
    case "level":
      return "difficulty";

    case "explanation":
    case "explain":
    case "rationale":
      return "explanation";

    case "optiona":
    case "option1":
    case "opta":
      return "option_a";

    case "optionb":
    case "option2":
    case "optb":
      return "option_b";

    case "optionc":
    case "option3":
    case "optc":
      return "option_c";

    case "optiond":
    case "option4":
    case "optd":
      return "option_d";

    case "optione":
    case "option5":
    case "opte":
      return "option_e";

    case "correctoption":
    case "correctanswer":
    case "correct":
    case "answer":
    case "ans":
      return "correct_option";

    case "programminglanguage":
    case "language":
    case "lang":
      return "programming_language";

    case "startercode":
    case "starter":
    case "boilerplate":
      return "starter_code";

    case "constraints":
    case "constraint":
      return "constraints";

    case "expectedoutput":
    case "output":
    case "expected":
      return "expected_output";

    case "testtitle":
    case "quiztitle":
      return "test_title";

    case "duration":
    case "durationminutes":
    case "timelimit":
      return "duration_minutes";

    case "passingmarks":
    case "passmark":
      return "passing_marks";

    default:
      return (rawHeader || "").trim().toLowerCase();
  }
}

/**
 * Parses CSV text and converts to structured quiz and questions payload
 */
function parseQuizCsv(csvText) {
  const tokenRows = parseCsvTokens(csvText);

  if (!tokenRows || tokenRows.length < 2) {
    throw new Error("CSV file must contain a header row and at least one question row.");
  }

  const rawHeaders = tokenRows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeaderKey);

  // Validate that question_text or question exists in headers
  if (!normalizedHeaders.includes("question_text")) {
    throw new Error(
      "CSV header must contain a 'question_text' or 'question' column. Found columns: " +
        rawHeaders.join(", ")
    );
  }

  const metadata = {
    title: null,
    duration_minutes: null,
    passing_marks: null,
  };

  const parsedQuestions = [];

  for (let i = 1; i < tokenRows.length; i += 1) {
    const rowTokens = tokenRows[i];
    const row = {};

    normalizedHeaders.forEach((header, idx) => {
      row[header] = rowTokens[idx] !== undefined ? rowTokens[idx] : "";
    });

    const rowNumber = i + 1;
    const questionText = (row.question_text || "").trim();

    if (!questionText) {
      continue; // Skip empty rows
    }

    // Capture metadata if defined
    if (row.test_title && !metadata.title) {
      metadata.title = row.test_title.trim();
    }
    if (row.duration_minutes && !metadata.duration_minutes) {
      const parsedDur = parseInt(row.duration_minutes, 10);
      if (!isNaN(parsedDur) && parsedDur > 0) metadata.duration_minutes = parsedDur;
    }
    if (row.passing_marks && !metadata.passing_marks) {
      const parsedPass = parseFloat(row.passing_marks);
      if (!isNaN(parsedPass) && parsedPass >= 0) metadata.passing_marks = parsedPass;
    }

    // Determine question type
    let rawType = (row.question_type || "").toUpperCase().trim();
    if (!rawType) {
      // Auto-detect based on presence of programming_language or expected_output
      if (row.programming_language || row.expected_output || row.starter_code) {
        rawType = "CODING";
      } else {
        rawType = "MCQ";
      }
    }
    const question_type = rawType === "CODING" ? "CODING" : "MCQ";

    // Marks
    const marks = parseFloat(row.marks) || 5;

    // Difficulty
    let diff = (row.difficulty || "").toUpperCase().trim();
    if (!["EASY", "MEDIUM", "HARD"].includes(diff)) {
      diff = "MEDIUM";
    }

    const explanation = (row.explanation || "").trim() || null;

    if (question_type === "MCQ") {
      const optA = (row.option_a || "").trim();
      const optB = (row.option_b || "").trim();
      const optC = (row.option_c || "").trim();
      const optD = (row.option_d || "").trim();
      const optE = (row.option_e || "").trim();

      const optionsList = [
        { label: "A", text: optA },
        { label: "B", text: optB },
        { label: "C", text: optC },
        { label: "D", text: optD },
        { label: "E", text: optE },
      ].filter((o) => o.text !== "");

      if (optionsList.length < 2) {
        throw new Error(
          `Row ${rowNumber}: MCQ question "${questionText.slice(0, 30)}..." must have at least 2 options (option_a and option_b).`
        );
      }

      const rawCorrect = (row.correct_option || "").trim();
      if (!rawCorrect) {
        throw new Error(
          `Row ${rowNumber}: MCQ question "${questionText.slice(0, 30)}..." is missing 'correct_option' (e.g. A, B, C, or D).`
        );
      }

      // Check which option matches the correct value (by label like 'A', by 1-based index '1', or by exact text)
      let matched = false;
      const upperCorrect = rawCorrect.toUpperCase();

      const options = optionsList.map((opt, idx) => {
        let isCorrect = false;
        if (upperCorrect === opt.label) {
          isCorrect = true;
        } else if (rawCorrect === String(idx + 1)) {
          isCorrect = true;
        } else if (rawCorrect.toLowerCase() === opt.text.toLowerCase()) {
          isCorrect = true;
        }

        if (isCorrect) matched = true;
        return {
          option_label: opt.label,
          option_text: opt.text,
          is_correct: isCorrect,
          display_order: idx + 1,
        };
      });

      if (!matched) {
        throw new Error(
          `Row ${rowNumber}: 'correct_option' value "${rawCorrect}" does not match any provided options (${optionsList
            .map((o) => o.label)
            .join(", ")}).`
        );
      }

      // Verify exactly 1 correct option
      const correctCount = options.filter((o) => o.is_correct).length;
      if (correctCount !== 1) {
        throw new Error(
          `Row ${rowNumber}: Question must have exactly 1 correct option (found ${correctCount}).`
        );
      }

      parsedQuestions.push({
        rowNumber,
        question_type: "MCQ",
        question_text: questionText,
        marks,
        difficulty: diff,
        explanation,
        options,
      });
    } else {
      // CODING question
      const programming_language = (row.programming_language || "").trim().toLowerCase();
      if (!programming_language) {
        throw new Error(
          `Row ${rowNumber}: Coding question "${questionText.slice(0, 30)}..." is missing 'programming_language'.`
        );
      }

      const expected_output = (row.expected_output || "").trim();
      if (!expected_output) {
        throw new Error(
          `Row ${rowNumber}: Coding question "${questionText.slice(0, 30)}..." is missing 'expected_output'.`
        );
      }

      const starter_code = (row.starter_code || "").trim() || null;
      const constraints = (row.constraints || "").trim() || null;

      parsedQuestions.push({
        rowNumber,
        question_type: "CODING",
        question_text: questionText,
        marks,
        difficulty: diff,
        explanation,
        programming_language,
        starter_code,
        constraints,
        expected_output,
        options: [],
      });
    }
  }

  if (parsedQuestions.length === 0) {
    throw new Error("No valid questions found in the CSV file.");
  }

  return {
    metadata,
    questions: parsedQuestions,
  };
}

/**
 * Returns a complete sample CSV string with realistic MCQ and Coding examples
 */
function getSampleCsvString() {
  return [
    'question_text,question_type,marks,difficulty,option_a,option_b,option_c,option_d,correct_option,explanation,programming_language,starter_code,constraints,expected_output',
    '"What is the output of typeof null in JavaScript?",MCQ,5,EASY,"object","null","undefined","boolean",A,"In JavaScript, typeof null is a legacy quirk returning object.",,,',
    '"Which data structure follows the LIFO (Last In First Out) principle?",MCQ,5,EASY,"Queue","Stack","Array","Tree",B,"Stacks operate on Last-In, First-Out (LIFO).",,,',
    '"Which HTTP status code corresponds to \'Internal Server Error\'?",MCQ,5,MEDIUM,"400","404","500","502",C,"500 denotes Internal Server Error.",,,',
    '"Write a function to return the sum of two integers a and b.",CODING,10,MEDIUM,,,,,,,"python","def solution(a=2, b=3):\n    return a + b\n\nprint(solution())","1 <= a, b <= 1000","5"',
  ].join("\n");
}

module.exports = {
  parseCsvTokens,
  normalizeHeaderKey,
  parseQuizCsv,
  getSampleCsvString,
};
