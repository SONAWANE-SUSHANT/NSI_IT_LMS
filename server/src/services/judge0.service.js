/**
 * Judge0 Code Execution Service
 *
 * Handles compiling, executing, and grading coding submissions via Judge0.
 * Strictly avoids local arbitrary shell/eval execution.
 */

const { resolveLanguage, DEFAULT_JUDGE0_URL } = require("../config/judge0Languages");

const getJudge0BaseUrl = () => {
  return (process.env.JUDGE0_API_URL || DEFAULT_JUDGE0_URL).replace(/\/$/, "");
};

const getJudge0Headers = () => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (process.env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
  }
  if (process.env.JUDGE0_API_HOST) {
    headers["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST;
  }

  return headers;
};

/**
 * Poll for submission result if Judge0 wait=true does not immediately complete
 */
const pollSubmission = async (token, maxAttempts = 10, delayMs = 500) => {
  const baseUrl = getJudge0BaseUrl();
  const headers = getJudge0Headers();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      const res = await fetch(`${baseUrl}/submissions/${token}?base64_encoded=false`, {
        headers,
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        // status_id: 1 (In Queue), 2 (Processing)
        if (data.status?.id > 2) {
          return data;
        }
      }
    } catch (err) {
      // ignore transient polling errors and retry
    }
  }

  throw new Error("Judge0 execution timed out waiting for result");
};

/**
 * Execute source code through Judge0
 *
 * @param {Object} params
 * @param {string} params.source_code - Student or reference source code
 * @param {string|number} params.language - Language identifier (alias, name, or numeric ID)
 * @param {string} [params.stdin=""] - Input passed to the program
 * @param {string} [params.expected_output=null] - Expected output to check against
 * @param {number} [params.cpu_time_limit=5] - Max CPU time in seconds
 * @param {number} [params.memory_limit=128000] - Memory limit in KB
 */
const executeCode = async ({
  source_code,
  language,
  stdin = "",
  expected_output = null,
  cpu_time_limit = 5,
  memory_limit = 128000,
}) => {
  if (!source_code || typeof source_code !== "string" || !source_code.trim()) {
    throw new Error("Source code cannot be empty");
  }

  const resolved = resolveLanguage(language);
  if (!resolved) {
    throw new Error(
      `Unsupported programming language: "${language}". Please choose from supported languages.`
    );
  }

  const baseUrl = getJudge0BaseUrl();
  const headers = getJudge0Headers();

  const payload = {
    source_code: source_code,
    language_id: resolved.id,
    stdin: stdin || "",
    cpu_time_limit: Math.min(Math.max(Number(cpu_time_limit) || 5, 1), 15),
    memory_limit: Math.min(Math.max(Number(memory_limit) || 128000, 16000), 512000),
  };

  if (expected_output !== null && expected_output !== undefined) {
    payload.expected_output = String(expected_output);
  }

  try {
    const res = await fetch(
      `${baseUrl}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      }
    );

    let result = null;

    if (res.ok) {
      result = await res.json();
    } else {
      const errBody = await res.text();
      throw new Error(`Judge0 API error (${res.status}): ${errBody || res.statusText}`);
    }

    // If result was queued (status_id 1 or 2), poll for completion
    if (result && result.status && result.status.id <= 2 && result.token) {
      result = await pollSubmission(result.token);
    }

    // Normalize result
    const stdout = result.stdout || "";
    const stderr = result.stderr || "";
    const compileOutput = result.compile_output || "";
    const message = result.message || "";
    const statusDesc = result.status?.description || "Unknown";
    const statusId = result.status?.id || 0;
    const time = result.time !== null && result.time !== undefined ? String(result.time) : null;
    const memory = result.memory !== null && result.memory !== undefined ? Number(result.memory) : null;

    // Check correctness against expected output if provided
    let isCorrect = false;
    if (expected_output !== null && expected_output !== undefined) {
      const normalizedStdout = stdout.replace(/\r\n/g, "\n").trim();
      const normalizedExpected = String(expected_output).replace(/\r\n/g, "\n").trim();
      isCorrect = statusId === 3 || (statusId !== 6 && statusId < 7 && normalizedStdout === normalizedExpected);
    } else {
      isCorrect = statusId === 3;
    }

    return {
      success: true,
      language: {
        id: resolved.id,
        name: resolved.name,
        key: resolved.key,
      },
      status: statusDesc,
      status_id: statusId,
      is_correct: isCorrect,
      stdout: stdout,
      stderr: stderr,
      compile_output: compileOutput,
      message: message,
      time: time,
      memory: memory,
      token: result.token || null,
    };
  } catch (err) {
    console.error("[Judge0Service] Execution error:", err.message);
    return {
      success: false,
      language: {
        id: resolved.id,
        name: resolved.name,
        key: resolved.key,
      },
      status: "Execution Service Error",
      status_id: 13,
      is_correct: false,
      stdout: "",
      stderr: err.message || "Failed to communicate with Judge0 execution engine",
      compile_output: "",
      message: "The code execution service encountered an error. Please try again.",
      time: null,
      memory: null,
      token: null,
    };
  }
};

module.exports = {
  executeCode,
  getJudge0BaseUrl,
};
