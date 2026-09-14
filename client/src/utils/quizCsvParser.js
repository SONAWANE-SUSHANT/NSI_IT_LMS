/**
 * Client-side CSV Parser and Validator for Quizzes / Tests
 * Matches RFC 4180 parsing logic
 */

export function parseCsvTokens(text) {
  const clean = (text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentVal += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      currentRow.push(currentVal.trim());
      currentVal = '';
      if (currentRow.some((col) => col !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((col) => col !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function normalizeHeaderKey(rawHeader) {
  const h = (rawHeader || '').toLowerCase().replace(/[\s_-]+/g, '');
  switch (h) {
    case 'question':
    case 'questiontext':
    case 'prompt':
    case 'title':
      return 'question_text';

    case 'questiontype':
    case 'type':
      return 'question_type';

    case 'marks':
    case 'mark':
    case 'points':
    case 'score':
      return 'marks';

    case 'difficulty':
    case 'level':
      return 'difficulty';

    case 'explanation':
    case 'explain':
    case 'rationale':
      return 'explanation';

    case 'optiona':
    case 'option1':
    case 'opta':
      return 'option_a';

    case 'optionb':
    case 'option2':
    case 'optb':
      return 'option_b';

    case 'optionc':
    case 'option3':
    case 'optc':
      return 'option_c';

    case 'optiond':
    case 'option4':
    case 'optd':
      return 'option_d';

    case 'optione':
    case 'option5':
    case 'opte':
      return 'option_e';

    case 'correctoption':
    case 'correctanswer':
    case 'correct':
    case 'answer':
    case 'ans':
      return 'correct_option';

    case 'programminglanguage':
    case 'language':
    case 'lang':
      return 'programming_language';

    case 'startercode':
    case 'starter':
    case 'boilerplate':
      return 'starter_code';

    case 'constraints':
    case 'constraint':
      return 'constraints';

    case 'expectedoutput':
    case 'output':
    case 'expected':
      return 'expected_output';

    case 'testtitle':
    case 'quiztitle':
      return 'test_title';

    case 'duration':
    case 'durationminutes':
    case 'timelimit':
      return 'duration_minutes';

    case 'passingmarks':
    case 'passmark':
      return 'passing_marks';

    default:
      return (rawHeader || '').trim().toLowerCase();
  }
}

export function parseAndValidateQuizCsv(csvText) {
  const tokenRows = parseCsvTokens(csvText);

  if (!tokenRows || tokenRows.length < 2) {
    throw new Error('CSV file must contain a header row and at least one question row.');
  }

  const rawHeaders = tokenRows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeaderKey);

  if (!normalizedHeaders.includes('question_text')) {
    throw new Error(
      `CSV header must contain a 'question_text' or 'question' column. Found columns: ${rawHeaders.join(', ')}`
    );
  }

  const metadata = {
    title: '',
    duration_minutes: '',
    passing_marks: '',
  };

  const parsedQuestions = [];

  for (let i = 1; i < tokenRows.length; i += 1) {
    const rowTokens = tokenRows[i];
    const row = {};

    normalizedHeaders.forEach((header, idx) => {
      row[header] = rowTokens[idx] !== undefined ? rowTokens[idx] : '';
    });

    const rowNumber = i + 1;
    const questionText = (row.question_text || '').trim();

    if (!questionText) {
      continue;
    }

    if (row.test_title && !metadata.title) {
      metadata.title = row.test_title.trim();
    }
    if (row.duration_minutes && !metadata.duration_minutes) {
      const d = parseInt(row.duration_minutes, 10);
      if (!isNaN(d) && d > 0) metadata.duration_minutes = d;
    }
    if (row.passing_marks && !metadata.passing_marks) {
      const p = parseFloat(row.passing_marks);
      if (!isNaN(p) && p >= 0) metadata.passing_marks = p;
    }

    const errors = [];

    // Determine type
    let rawType = (row.question_type || '').toUpperCase().trim();
    if (!rawType) {
      if (row.programming_language || row.expected_output || row.starter_code) {
        rawType = 'CODING';
      } else {
        rawType = 'MCQ';
      }
    }
    const question_type = rawType === 'CODING' ? 'CODING' : 'MCQ';

    // Marks
    const rawMarks = parseFloat(row.marks);
    const marks = isNaN(rawMarks) || rawMarks <= 0 ? 5 : rawMarks;

    // Difficulty
    let diff = (row.difficulty || '').toUpperCase().trim();
    if (!['EASY', 'MEDIUM', 'HARD'].includes(diff)) {
      diff = 'MEDIUM';
    }

    const explanation = (row.explanation || '').trim();

    let options = [];
    let programming_language = '';
    let starter_code = '';
    let constraints = '';
    let expected_output = '';

    if (question_type === 'MCQ') {
      const optA = (row.option_a || '').trim();
      const optB = (row.option_b || '').trim();
      const optC = (row.option_c || '').trim();
      const optD = (row.option_d || '').trim();
      const optE = (row.option_e || '').trim();

      const optionsList = [
        { label: 'A', text: optA },
        { label: 'B', text: optB },
        { label: 'C', text: optC },
        { label: 'D', text: optD },
        { label: 'E', text: optE },
      ].filter((o) => o.text !== '');

      if (optionsList.length < 2) {
        errors.push('Requires at least 2 options (option_a and option_b)');
      }

      const rawCorrect = (row.correct_option || '').trim();
      if (!rawCorrect) {
        errors.push('Missing correct_option (e.g. A, B, C, or D)');
      }

      const upperCorrect = rawCorrect.toUpperCase();
      let hasMatch = false;

      options = optionsList.map((opt, idx) => {
        let isCorrect = false;
        if (upperCorrect === opt.label) {
          isCorrect = true;
        } else if (rawCorrect === String(idx + 1)) {
          isCorrect = true;
        } else if (rawCorrect.toLowerCase() === opt.text.toLowerCase()) {
          isCorrect = true;
        }

        if (isCorrect) hasMatch = true;

        return {
          option_label: opt.label,
          option_text: opt.text,
          is_correct: isCorrect,
          display_order: idx + 1,
        };
      });

      if (rawCorrect && !hasMatch && optionsList.length >= 2) {
        errors.push(`Correct option '${rawCorrect}' does not match any provided options`);
      }
    } else {
      // CODING
      programming_language = (row.programming_language || '').trim().toLowerCase();
      if (!programming_language) {
        errors.push('Missing programming_language (e.g. python, javascript)');
      }

      expected_output = (row.expected_output || '').trim();
      if (!expected_output) {
        errors.push('Missing expected_output for automated evaluation');
      }

      starter_code = (row.starter_code || '').trim();
      constraints = (row.constraints || '').trim();
    }

    parsedQuestions.push({
      rowNumber,
      question_type,
      question_text: questionText,
      marks,
      difficulty: diff,
      explanation,
      options,
      programming_language,
      starter_code,
      constraints,
      expected_output,
      errors,
      isValid: errors.length === 0,
    });
  }

  if (parsedQuestions.length === 0) {
    throw new Error('No valid question rows found in CSV file.');
  }

  return {
    metadata,
    questions: parsedQuestions,
  };
}

export function downloadSampleQuizCsv() {
  const sampleCsv = [
    'question_text,question_type,marks,difficulty,option_a,option_b,option_c,option_d,correct_option,explanation,programming_language,starter_code,constraints,expected_output',
    '"What is the output of typeof null in JavaScript?",MCQ,5,EASY,"object","null","undefined","boolean",A,"In JavaScript, typeof null is a legacy quirk returning object.",,,',
    '"Which data structure follows the LIFO (Last In First Out) principle?",MCQ,5,EASY,"Queue","Stack","Array","Tree",B,"Stacks operate on Last-In, First-Out (LIFO).",,,',
    '"Which HTTP status code corresponds to \'Internal Server Error\'?",MCQ,5,MEDIUM,"400","404","500","502",C,"500 denotes Internal Server Error.",,,',
    '"Write a function to return the sum of two integers a and b.",CODING,10,MEDIUM,,,,,,,"python","def solution(a=2, b=3):\n    return a + b\n\nprint(solution())","1 <= a, b <= 1000","5"',
  ].join('\n');

  const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'test-creation-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
