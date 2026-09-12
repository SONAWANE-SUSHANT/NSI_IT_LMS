require("dotenv").config();
const {
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAttemptAnswer,
  Lecture,
  User,
} = require("../models");

async function seedData() {
  console.log("=== SEEDING REALISTIC PRODUCTION SUPPORT ASSESSMENTS ===");

  const admin = await User.findOne({ where: { role_id: 1 } });
  const instructor = await User.findOne({ where: { role_id: 2 } });
  const student = await User.findOne({ where: { role_id: 3 } });

  const userId = instructor?.id || admin?.id || 1;

  // 1. Clean up old test quizzes with E2E titles
  await Quiz.destroy({
    where: {
      title: [
        "E2E Automated Assessment: Full-Stack Fundamentals",
        "E2E Phase 2 Assessment - 1789125352672",
        "E2E Phase 2 Assessment - 1789125373946",
        "E2E Phase 2 Assessment - 1789125430240",
      ],
    },
  }).catch(() => {});

  // ── Quiz 1: Linux Fundamentals & Shell Scripting (PUBLISHED) ──
  const q1 = await Quiz.create({
    session_id: 17, // AWS VPC & Linux Environment
    title: "Linux Fundamentals & Shell Scripting",
    description: "Production Support assessment testing Core Linux commands, permissions, filesystem navigation, and shell scripting.",
    instructions: "Answer all questions. You have 30 minutes. Use the integrated code editor to write and test your bash scripts before submitting.",
    duration_minutes: 30,
    total_marks: 40,
    passing_marks: 25,
    max_attempts: 2,
    status: "PUBLISHED",
    available_from: new Date(Date.now() - 24 * 3600 * 1000),
    available_until: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    created_by: userId,
  });

  // Questions for Quiz 1
  const q1_q1 = await QuizQuestion.create({
    quiz_id: q1.id,
    question_type: "MCQ",
    question_text: "Which Linux command displays disk space usage in human-readable format?",
    marks: 5,
    display_order: 1,
    difficulty: "EASY",
    explanation: "df -h (disk free human-readable) displays available disk space for all mounted filesystems in readable units (GB, MB).",
    created_by: userId,
  });
  await QuizOption.bulkCreate([
    { question_id: q1_q1.id, option_label: "A", option_text: "ps aux", is_correct: false, display_order: 1 },
    { question_id: q1_q1.id, option_label: "B", option_text: "df -h", is_correct: true, display_order: 2 },
    { question_id: q1_q1.id, option_label: "C", option_text: "chmod 755", is_correct: false, display_order: 3 },
    { question_id: q1_q1.id, option_label: "D", option_text: "grep -rnw", is_correct: false, display_order: 4 },
  ]);

  const q1_q2 = await QuizQuestion.create({
    quiz_id: q1.id,
    question_type: "MCQ",
    question_text: "Which command lists open network ports and active TCP listening sockets?",
    marks: 5,
    display_order: 2,
    difficulty: "MEDIUM",
    explanation: "ss -tulpn displays all listening TCP and UDP sockets with their associated process IDs and program names.",
    created_by: userId,
  });
  await QuizOption.bulkCreate([
    { question_id: q1_q2.id, option_label: "A", option_text: "ss -tulpn", is_correct: true, display_order: 1 },
    { question_id: q1_q2.id, option_label: "B", option_text: "cat /etc/resolv.conf", is_correct: false, display_order: 2 },
    { question_id: q1_q2.id, option_label: "C", option_text: "traceroute -n", is_correct: false, display_order: 3 },
    { question_id: q1_q2.id, option_label: "D", option_text: "kill -9 1", is_correct: false, display_order: 4 },
  ]);

  const q1_q3 = await QuizQuestion.create({
    quiz_id: q1.id,
    question_type: "MCQ",
    question_text: "What does the shell variable '$?' returning 0 signify in a Linux environment?",
    marks: 5,
    display_order: 3,
    difficulty: "EASY",
    explanation: "In UNIX/Linux, an exit code of 0 denotes that the previous command executed successfully without errors.",
    created_by: userId,
  });
  await QuizOption.bulkCreate([
    { question_id: q1_q3.id, option_label: "A", option_text: "Command execution encountered a fatal error", is_correct: false, display_order: 1 },
    { question_id: q1_q3.id, option_label: "B", option_text: "Command executed successfully with exit status 0", is_correct: true, display_order: 2 },
    { question_id: q1_q3.id, option_label: "C", option_text: "Process was killed by SIGKILL", is_correct: false, display_order: 3 },
    { question_id: q1_q3.id, option_label: "D", option_text: "Environment variable is undefined", is_correct: false, display_order: 4 },
  ]);

  const q1_q4 = await QuizQuestion.create({
    quiz_id: q1.id,
    question_type: "CODING",
    question_text: "Write a Bash script to search for all .log files in /var/log and print their absolute paths.",
    marks: 15,
    display_order: 4,
    difficulty: "MEDIUM",
    programming_language: "bash",
    starter_code: `#!/bin/bash\n# Write your solution to find all .log files\nfind /var/log -name "*.log" 2>/dev/null || echo "/var/log/app.log"\n`,
    constraints: "Must complete execution within 2 seconds. Do not modify system files.",
    expected_output: "/var/log/app.log\n/var/log/system.log",
    explanation: "The find utility with -name '*.log' traverses the specified directory and lists all files matching the pattern.",
    created_by: userId,
  });

  const q1_q5 = await QuizQuestion.create({
    quiz_id: q1.id,
    question_type: "CODING",
    question_text: "Write a Python script that reads numbers from standard input, calculates the sum of all positive even integers, and prints the total.",
    marks: 10,
    display_order: 5,
    difficulty: "MEDIUM",
    programming_language: "python",
    starter_code: `import sys\n\ndef compute_even_sum():\n    total = 0\n    for line in sys.stdin:\n        try:\n            n = int(line.strip())\n            if n > 0 and n % 2 == 0:\n                total += n\n        except ValueError:\n            pass\n    print(total)\n\nif __name__ == '__main__':\n    compute_even_sum()\n`,
    constraints: "Standard integer inputs. Time limit 2.0s.",
    expected_output: "Sum of even numbers",
    explanation: "Filters for positive numbers divisible by 2 and prints their cumulative sum.",
    created_by: userId,
  });

  // ── Quiz 2: SQL Basics & Query Optimization (DRAFT) ──
  const q2 = await Quiz.create({
    session_id: 18,
    title: "SQL Basics & Query Optimization",
    description: "Database performance, index utilization, and query troubleshooting for application support teams.",
    instructions: "Draft state quiz. Review question definitions and options before publishing.",
    duration_minutes: 25,
    total_marks: 20,
    passing_marks: 12,
    max_attempts: 2,
    status: "DRAFT",
    created_by: userId,
  });

  const q2_q1 = await QuizQuestion.create({
    quiz_id: q2.id,
    question_type: "MCQ",
    question_text: "Which SQL clause is used to filter grouped aggregated rows after a GROUP BY statement?",
    marks: 5,
    display_order: 1,
    difficulty: "MEDIUM",
    explanation: "HAVING filters aggregate values created by GROUP BY; WHERE filters individual rows before grouping.",
    created_by: userId,
  });
  await QuizOption.bulkCreate([
    { question_id: q2_q1.id, option_label: "A", option_text: "WHERE", is_correct: false, display_order: 1 },
    { question_id: q2_q1.id, option_label: "B", option_text: "HAVING", is_correct: true, display_order: 2 },
    { question_id: q2_q1.id, option_label: "C", option_text: "ORDER BY", is_correct: false, display_order: 3 },
    { question_id: q2_q1.id, option_label: "D", option_text: "PARTITION BY", is_correct: false, display_order: 4 },
  ]);

  const q2_q2 = await QuizQuestion.create({
    quiz_id: q2.id,
    question_type: "CODING",
    question_text: "Write a Python function to validate that a table name contains only valid alphanumeric characters and underscores.",
    marks: 15,
    display_order: 2,
    difficulty: "EASY",
    programming_language: "python",
    starter_code: `import re\n\ndef is_valid_identifier(name: str) -> bool:\n    # Return True if name contains only letters, digits, and underscores\n    return bool(re.match(r'^[a-zA-Z0-9_]+$', name))\n\nprint(is_valid_identifier("users_table_2026"))\n`,
    constraints: "No special symbols, semicolons, or whitespace allowed.",
    expected_output: "True",
    created_by: userId,
  });

  // ── Quiz 3: Production Support Incident Management (CLOSED) ──
  const q3 = await Quiz.create({
    session_id: 20,
    title: "Production Support Incident Management",
    description: "Assessment on P1/P2 incident escalation, root cause analysis (RCA), and SLA management.",
    instructions: "This assessment period has officially concluded.",
    duration_minutes: 35,
    total_marks: 25,
    passing_marks: 15,
    max_attempts: 1,
    status: "CLOSED",
    available_from: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    available_until: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    created_by: userId,
  });

  const q3_q1 = await QuizQuestion.create({
    quiz_id: q3.id,
    question_type: "MCQ",
    question_text: "In ITIL production support, what is the primary objective of Incident Management?",
    marks: 10,
    display_order: 1,
    difficulty: "MEDIUM",
    explanation: "Incident Management focuses on rapidly restoring normal service operation and minimizing adverse impact on business operations.",
    created_by: userId,
  });
  await QuizOption.bulkCreate([
    { question_id: q3_q1.id, option_label: "A", option_text: "Identify the permanent architectural root cause", is_correct: false, display_order: 1 },
    { question_id: q3_q1.id, option_label: "B", option_text: "Restore normal service operation as quickly as possible", is_correct: true, display_order: 2 },
    { question_id: q3_q1.id, option_label: "C", option_text: "Deploy scheduled version releases to production", is_correct: false, display_order: 3 },
    { question_id: q3_q1.id, option_label: "D", option_text: "Archive outdated audit logs", is_correct: false, display_order: 4 },
  ]);

  const q3_q2 = await QuizQuestion.create({
    quiz_id: q3.id,
    question_type: "CODING",
    question_text: "Write a Bash command to tail live application error logs.",
    marks: 15,
    display_order: 2,
    difficulty: "EASY",
    programming_language: "bash",
    starter_code: `#!/bin/bash\n# Stream appended error logs\ntail -n 50 /var/log/syslog 2>/dev/null || echo "Log stream active"\n`,
    constraints: "Safe read-only operation.",
    created_by: userId,
  });

  // ── Seed a sample completed attempt for student 3 on Quiz 1 ──
  if (student) {
    const pastAttempt = await QuizAttempt.create({
      quiz_id: q1.id,
      student_id: student.id,
      attempt_number: 1,
      status: "SUBMITTED",
      score: 35.0,
      total_marks: 40.0,
      passed: true,
      started_at: new Date(Date.now() - 3600 * 1000),
      submitted_at: new Date(Date.now() - 1800 * 1000),
    });

    await QuizAttemptAnswer.create({
      attempt_id: pastAttempt.id,
      question_id: q1_q1.id,
      selected_option_id: (await QuizOption.findOne({ where: { question_id: q1_q1.id, is_correct: true } })).id,
      marks_awarded: 5.0,
      is_correct: true,
    });

    await QuizAttemptAnswer.create({
      attempt_id: pastAttempt.id,
      question_id: q1_q2.id,
      selected_option_id: (await QuizOption.findOne({ where: { question_id: q1_q2.id, is_correct: true } })).id,
      marks_awarded: 5.0,
      is_correct: true,
    });

    await QuizAttemptAnswer.create({
      attempt_id: pastAttempt.id,
      question_id: q1_q4.id,
      code_submission: `find /var/log -name "*.log"\n`,
      marks_awarded: 15.0,
      is_correct: true,
    });

    console.log("✓ Sample completed attempt created for Student #3 with score 35/40 (Passed)");
  }

  console.log("✓ Seeded 3 Real Production Quizzes:");
  console.log("  1. Linux Fundamentals & Shell Scripting (PUBLISHED)");
  console.log("  2. SQL Basics & Query Optimization (DRAFT)");
  console.log("  3. Production Support Incident Management (CLOSED)");
}

seedData()
  .then(() => {
    console.log("=== SEEDING FINISHED SUCCESSFULLY ===");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
