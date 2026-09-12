/**
 * Centralized Judge0 Language Configuration & Resolver
 *
 * Provides:
 * 1. Verified canonical language definitions for LMS-supported languages
 * 2. Dynamic fetching & caching from Judge0 /languages endpoint
 * 3. Robust language resolution by alias, name, or numeric ID
 */

const DEFAULT_JUDGE0_URL = process.env.JUDGE0_API_URL || "https://ce.judge0.com";

// Verified baseline mapping from official Judge0 CE /languages
const VERIFIED_LANGUAGES = [
  {
    id: 71,
    name: "Python (3.8.1)",
    key: "python",
    aliases: ["python", "python3", "py"],
    extension: "py",
    default_starter_code: "def solution():\n    # Write your code here\n    pass\n\nif __name__ == '__main__':\n    solution()\n",
  },
  {
    id: 92,
    name: "Python (3.11.2)",
    key: "python3.11",
    aliases: ["python3.11", "py311"],
    extension: "py",
    default_starter_code: "def solution():\n    # Write your code here\n    pass\n\nif __name__ == '__main__':\n    solution()\n",
  },
  {
    id: 93,
    name: "JavaScript (Node.js 18.15.0)",
    key: "javascript",
    aliases: ["javascript", "js", "node", "nodejs"],
    extension: "js",
    default_starter_code: "function solution() {\n  // Write your code here\n}\n\nsolution();\n",
  },
  {
    id: 63,
    name: "JavaScript (Node.js 12.14.0)",
    key: "javascript-legacy",
    aliases: ["js-legacy", "node12"],
    extension: "js",
    default_starter_code: "function solution() {\n  // Write your code here\n}\n\nsolution();\n",
  },
  {
    id: 91,
    name: "Java (JDK 17.0.6)",
    key: "java",
    aliases: ["java", "java17", "jdk"],
    extension: "java",
    default_starter_code: "public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n",
  },
  {
    id: 62,
    name: "Java (OpenJDK 13.0.1)",
    key: "java13",
    aliases: ["java13", "openjdk"],
    extension: "java",
    default_starter_code: "public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n",
  },
  {
    id: 50,
    name: "C (GCC 9.2.0)",
    key: "c",
    aliases: ["c", "gcc"],
    extension: "c",
    default_starter_code: "#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}\n",
  },
  {
    id: 103,
    name: "C (GCC 14.1.0)",
    key: "c-gcc14",
    aliases: ["c14", "gcc14"],
    extension: "c",
    default_starter_code: "#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}\n",
  },
  {
    id: 54,
    name: "C++ (GCC 9.2.0)",
    key: "cpp",
    aliases: ["cpp", "c++", "g++"],
    extension: "cpp",
    default_starter_code: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n",
  },
  {
    id: 105,
    name: "C++ (GCC 14.1.0)",
    key: "cpp-gcc14",
    aliases: ["cpp14", "c++14"],
    extension: "cpp",
    default_starter_code: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n",
  },
  {
    id: 95,
    name: "Go (1.18.5)",
    key: "go",
    aliases: ["go", "golang"],
    extension: "go",
    default_starter_code: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write your code here\n}\n",
  },
  {
    id: 60,
    name: "Go (1.13.5)",
    key: "go-legacy",
    aliases: ["go-legacy", "go13"],
    extension: "go",
    default_starter_code: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write your code here\n}\n",
  },
  {
    id: 46,
    name: "Bash (5.0.0)",
    key: "bash",
    aliases: ["bash", "sh", "shell"],
    extension: "sh",
    default_starter_code: "#!/bin/bash\n# Write your script here\n",
  },
];

// In-memory cache for live languages from Judge0
let cachedJudge0Languages = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch available languages from the live Judge0 instance
 */
async function fetchAvailableLanguages(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedJudge0Languages && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return cachedJudge0Languages;
  }

  const baseUrl = (process.env.JUDGE0_API_URL || DEFAULT_JUDGE0_URL).replace(/\/$/, "");
  const headers = { Accept: "application/json" };
  if (process.env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
  }
  if (process.env.JUDGE0_API_HOST) {
    headers["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST;
  }

  try {
    const res = await fetch(`${baseUrl}/languages`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedJudge0Languages = data;
        lastFetchTimestamp = now;
        return data;
      }
    }
  } catch (err) {
    // Network or timeout failure; fall back to verified list
    console.warn(`[Judge0Languages] Could not reach Judge0 /languages endpoint: ${err.message}. Using verified baseline.`);
  }

  return VERIFIED_LANGUAGES.map((l) => ({ id: l.id, name: l.name }));
}

/**
 * Resolve any input identifier (alias, name, or integer ID) to a valid Judge0 language ID and metadata
 * @param {string|number} input - e.g. "python", "javascript", 71, "C++ (GCC 9.2.0)"
 * @returns {{ id: number, name: string, key: string } | null}
 */
function resolveLanguage(input) {
  if (input === undefined || input === null) return null;

  // Numeric ID passed directly
  const numericId = parseInt(input, 10);
  if (!isNaN(numericId) && numericId > 0 && String(input).trim() === String(numericId)) {
    const matched = VERIFIED_LANGUAGES.find((l) => l.id === numericId);
    if (matched) return matched;
    // If we have cached languages from Judge0
    if (cachedJudge0Languages) {
      const live = cachedJudge0Languages.find((l) => l.id === numericId);
      if (live) return { id: live.id, name: live.name, key: live.name.toLowerCase() };
    }
    return { id: numericId, name: `Language #${numericId}`, key: `lang-${numericId}` };
  }

  const normalized = String(input).toLowerCase().trim();

  // 1. Exact match on key or aliases
  for (const lang of VERIFIED_LANGUAGES) {
    if (lang.key === normalized) return lang;
    if (lang.aliases && lang.aliases.includes(normalized)) return lang;
    if (lang.name.toLowerCase() === normalized) return lang;
  }

  // 2. Check live cached languages exact match
  if (cachedJudge0Languages) {
    const exactLive = cachedJudge0Languages.find(
      (l) => l.name.toLowerCase() === normalized
    );
    if (exactLive) return { id: exactLive.id, name: exactLive.name, key: exactLive.name.toLowerCase() };
  }

  // 3. Fallback to word-boundary / substring match
  for (const lang of VERIFIED_LANGUAGES) {
    const langLower = lang.name.toLowerCase();
    // Match whole word or prefix, e.g. "python" in "Python (3.8.1)"
    const words = langLower.split(/[\s()]+/);
    if (words.includes(normalized)) return lang;
  }

  if (cachedJudge0Languages) {
    const live = cachedJudge0Languages.find((l) => {
      const words = l.name.toLowerCase().split(/[\s()]+/);
      return words.includes(normalized);
    });
    if (live) return { id: live.id, name: live.name, key: live.name.toLowerCase() };
  }

  return null;
}

/**
 * Get the list of languages supported by the LMS for coding questions
 */
function getSupportedLmsLanguages() {
  return VERIFIED_LANGUAGES.map((l) => ({
    id: l.id,
    name: l.name,
    key: l.key,
    aliases: l.aliases,
    extension: l.extension,
    starter_code: l.default_starter_code,
  }));
}

module.exports = {
  VERIFIED_LANGUAGES,
  DEFAULT_JUDGE0_URL,
  fetchAvailableLanguages,
  resolveLanguage,
  getSupportedLmsLanguages,
};
