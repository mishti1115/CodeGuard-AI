const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const db = require("./database");

dotenv.config({ path: __dirname + "/.env" });

const app = express();

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access token required"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "Invalid or expired token"
      });
    }

    req.user = user;
    next();
  });
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/test-cases", authenticateToken, async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({
      message: "Please provide code for test case generation."
    });
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `You are an expert software testing engineer.

Generate useful test cases for this ${language} code:

${code}

Include:
1. Normal test cases
2. Edge cases
3. Boundary cases
4. Expected output

Keep the test cases clear and easy to understand.`
    });

    res.json({
      message: "Test cases generated successfully!",
      testCases: response.output_text,
      source: "ai"
    });

  } catch (error) {
    console.log("AI unavailable. Using local test case generator.");

    const testCases = `
CodeGuard Test Cases

Language: ${language}

Test Case 1:
Input: Normal valid input
Expected: Program should produce the correct output.

Test Case 2:
Input: Empty or minimum input
Expected: Program should handle the minimum case correctly.

Test Case 3:
Input: Maximum or boundary input
Expected: Program should handle boundary values without errors.

Test Case 4:
Input: Invalid or unexpected input
Expected: Program should handle invalid input safely.

Recommendation:
Test the program with normal, edge and boundary cases before deployment.
`;

    res.json({
      message: "Test cases generated successfully!",
      testCases: testCases,
      source: "local"
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "CodeGuard AI Backend is running!"
  });
});

app.get("/api/reviews", authenticateToken, (req, res) => {
  const reviews = db.prepare(`
    SELECT * FROM reviews
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(req.user.userId);

  res.json(reviews);
});

// delete
app.delete("/api/reviews/:id", authenticateToken, (req, res) => {
  console.log("DELETE API HIT", req.params.id);
  try {
    const { id } = req.params;

    const result = db
  .prepare("DELETE FROM reviews WHERE id = ? AND user_id = ?")
  .run(id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Review not found"
      });
    }

    res.json({
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to delete review"
    });
  }
});

function localCodeReview(code, language) {
   console.log("NEW LOCAL ANALYZER RUNNING");

  const issues = [];
  const security = [];
  const performance = [];
  const quality = [];

  if (code.includes("gets(")) {
    security.push("gets() can cause buffer overflow vulnerabilities.");
  }

  if (code.includes("system(")) {
    security.push("system() can execute operating-system commands.");
  }

  if (
    code.toLowerCase().includes("password") &&
    (code.includes("=") || code.includes(":"))
  ) {
    security.push("Possible hard-coded password detected.");
  }

  if (
    code.toLowerCase().includes("api_key") ||
    code.toLowerCase().includes("apikey")
  ) {
    security.push("Possible hard-coded API key detected.");
  }

  const loopCount = (code.match(/\b(for|while)\b/g) || []).length;

  if (loopCount >= 2) {
    performance.push(
      "Multiple loops detected. Check whether nested loops cause O(n²) or higher complexity."
    );
  }

  if (code.includes("==") && code.includes("=")) {
    quality.push(
      "Review assignment and comparison operators carefully."
    );
  }

  if (code.includes("TODO") || code.includes("todo")) {
    quality.push("TODO comments indicate unfinished code.");
  }

  if (security.length === 0) {
    security.push("No obvious high-risk security pattern detected.");
  }

  if (performance.length === 0) {
    performance.push("No obvious performance issue detected.");
  }

  if (quality.length === 0) {
    quality.push("Code structure looks reasonable based on the local checks.");
  }

  issues.push(...security, ...performance, ...quality);

  return `
CodeGuard Local Analysis

Language: ${language}

🐛 Issues:
${issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}

🔐 Security:
${security.map(item => `• ${item}`).join("\n")}

⚡ Performance:
${performance.map(item => `• ${item}`).join("\n")}

🧹 Code Quality:
${quality.map(item => `• ${item}`).join("\n")}

📊 Time Complexity:
${loopCount >= 2
    ? "Potentially O(n²) or higher depending on loop nesting."
    : "No obvious nested-loop pattern detected."}

💾 Space Complexity:
Depends on the data structures and variables used in the submitted code.

💡 Recommendation:
Test the code with edge cases and review the detected issues before deployment.
`;
}
app.post("/api/review", authenticateToken, async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({
      message: "Please provide code for review."
    });
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `You are an expert code reviewer.

Review this ${language} code:

${code}

Analyze:
1. Bugs
2. Security vulnerabilities
3. Performance issues
4. Code quality
5. Improvements
6. Time complexity
7. Space complexity

Give a clear and concise review.`
    });

    db.prepare(`
  INSERT INTO reviews (user_id, code, language, review)
  VALUES (?, ?, ?, ?)
`).run(
  req.user.userId,
  code,
  language,
  response.output_text
);

    res.json({
      message: "AI review completed successfully!",
      language: language,
      review: response.output_text
    });

  } catch (error) {
    console.log("OpenAI unavailable. Using local analyzer.");

    const review = localCodeReview(code, language);

    db.prepare(`
  INSERT INTO reviews (user_id, code, language, review)
  VALUES (?, ?, ?, ?)
`).run(
  req.user.userId,
  code,
  language,
  review
);

    res.json({
      message: "Code review completed successfully!",
      language: language,
      review: review,
      source: "local"
    });
  }
});


app.post("/api/ask-ai", authenticateToken, async (req, res) => {

  const { code, language, question } = req.body;

  if (!code || !question) {
    return res.status(400).json({
      message: "Code and question are required."
    });
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are CodeGuard AI, an expert programming assistant.

Language: ${language}

User's Code:
${code}

User's Question:
${question}

Explain the answer clearly and help the developer understand the code.
`
    });

    res.json({
      answer: response.output_text,
      source: "openai"
    });

  } catch (error) {
    console.error("Ask AI error:", error.message);

    const lowerCode = code.toLowerCase();

let explanation = "";

if (
  lowerCode.includes("for") ||
  lowerCode.includes("while")
) {
  explanation +=
    "1. The code contains a loop. The loop repeatedly executes its statements until its condition becomes false.\n\n";
}

if (
  lowerCode.includes("if") ||
  lowerCode.includes("else")
) {
  explanation +=
    "2. The code contains conditional logic. The if/else statements decide which block of code will execute based on a condition.\n\n";
}

if (
  lowerCode.includes("cout") ||
  lowerCode.includes("printf") ||
  lowerCode.includes("console.log")
) {
  explanation +=
    "3. The code produces output using a standard output statement.\n\n";
}

if (lowerCode.includes("vector")) {
  explanation +=
    "4. The code uses a vector, which is a dynamic collection that can store multiple values.\n\n";
}

if (lowerCode.includes("string")) {
  explanation +=
    "5. The code works with string data.\n\n";
}

if (explanation === "") {
  explanation =
    "The code was received successfully. It can be analyzed by following its variables, statements, conditions, loops and final output.";
}

const localAnswer = `CodeGuard Local AI

Question:
${question}

Step-by-Step Analysis:
${explanation}

Submitted Language: ${language}
Code Length: ${code.length} characters

General Suggestions:
• Check the input values carefully.
• Verify all conditions and loops.
• Test edge cases.
• Check the expected output.
• Review time and space complexity.

Note:
OpenAI AI credits are currently unavailable, so CodeGuard is using local analysis mode.`;

    res.json({
      answer: localAnswer,
      source: "local"
    });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db
      .prepare(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
      )
      .run(name, email, hashedPassword);

    const token = jwt.sign(
      {
        userId: result.lastInsertRowid,
        email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: result.lastInsertRowid,
        name,
        email
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Signup failed"
    });
  }
});

const PORT = 5000;

function localOptimize(code, language) {
  const lines = code.split("\n").length;

  let result = `CODE OPTIMIZATION REPORT

Language: ${language}

Code Statistics:
- Lines of code: ${lines}

Performance:
- Review nested loops carefully.
- Avoid unnecessary repeated calculations.
- Prefer efficient data structures where appropriate.

Code Quality:
- Use meaningful variable names.
- Remove unused code.
- Keep functions small and focused.

Security:
- Avoid hard-coded passwords and API keys.
- Validate user input before processing it.

Complexity:
- Time complexity depends on the operations and loops used.
- Space complexity depends on additional arrays, objects, or data structures.

RECOMMENDATION:
Refactor repeated logic into reusable functions and choose appropriate data structures for better performance.

Note:
The local optimizer is being used because the AI service is currently unavailable.`;

  return result;
}

app.post("/api/optimize", authenticateToken, async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      error: "Code and language are required"
    });
  }

  try {
    if (client) {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: `
You are an expert software engineer.

Analyze the following ${language} code and provide:

1. Main problems
2. Performance improvements
3. Code quality improvements
4. Time complexity
5. Space complexity
6. Optimized/refactored version of the code
7. Short explanation of what was improved

Code:

${code}
        `
      });

      return res.json({
        success: true,
        optimization: response.output_text
      });
    }

    const optimization = localOptimize(code, language);

    res.json({
      success: true,
      optimization
    });

  } catch (error) {
    console.log("Optimization error:", error.message);

    res.status(500).json({
      error: "Optimization failed"
    });
  }
});

app.get("/api/github/repo", authenticateToken, async (req, res) => {

  const { repo } = req.query;

  if (!repo) {
    return res.status(400).json({
      error: "GitHub repository URL is required"
    });


  }

  try {
    const match = repo.match(
      /github\.com\/([^/]+)\/([^/#?]+)/
    );

    if (!match) {
      return res.status(400).json({
        error: "Invalid GitHub repository URL"
      });
    }

    const owner = match[1];
    const repoName = match[2].replace(".git", "");

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "CodeGuard-AI"
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "GitHub repository not found"
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      repository: {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        url: data.html_url,
        defaultBranch: data.default_branch
      }
    });

  } catch (error) {
    console.log("GitHub error:", error.message);

    res.status(500).json({
      error: "Unable to connect to GitHub"
    });
  }
});

app.get("/api/github/files", authenticateToken, async (req, res) => {
  const { repo, path = "" } = req.query;

  if (!repo) {
    return res.status(400).json({
      error: "GitHub repository URL is required"
    });
  }

  try {
    const match = repo.match(
      /github\.com\/([^/]+)\/([^/#?]+)/
    );

    if (!match) {
      return res.status(400).json({
        error: "Invalid GitHub repository URL"
      });
    }

    const owner = match[1];
    const repoName = match[2].replace(".git", "");

    const githubUrl =
      `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;

    const response = await fetch(githubUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "CodeGuard-AI"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Unable to fetch GitHub files"
      });
    }

    const data = await response.json();

    const files = Array.isArray(data)
      ? data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type,
          downloadUrl: item.download_url
        }))
      : [
          {
            name: data.name,
            path: data.path,
            type: data.type,
            downloadUrl: data.download_url
          }
        ];

    res.json({
      success: true,
      files
    });

  } catch (error) {
    console.log("GitHub files error:", error.message);

    res.status(500).json({
      error: "Unable to fetch repository files"
    });
  }
});

app.get("/api/github/file", authenticateToken, async (req, res) => {
  const { repo, path } = req.query;

  if (!repo || !path) {
    return res.status(400).json({
      error: "Repository URL and file path are required"
    });
  }

  try {
    const match = repo.match(
      /github\.com\/([^/]+)\/([^/#?]+)/
    );

    if (!match) {
      return res.status(400).json({
        error: "Invalid GitHub repository URL"
      });
    }

    const owner = match[1];
    const repoName = match[2].replace(".git", "");

    const githubUrl =
      `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(path)}`;

    const response = await fetch(githubUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "CodeGuard-AI"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Unable to fetch file"
      });
    }

    const data = await response.json();

    if (data.type !== "file") {
      return res.status(400).json({
        error: "Selected item is not a file"
      });
    }

    const content = Buffer.from(
      data.content,
      "base64"
    ).toString("utf-8");

    res.json({
      success: true,
      file: {
        name: data.name,
        path: data.path,
        content
      }
    });

  } catch (error) {
    console.log("GitHub file error:", error.message);

    res.status(500).json({
      error: "Unable to fetch file"
    });
  }
});

app.post("/api/github/review", authenticateToken, async (req, res) => {
  const { code, language, fileName } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "Code is required"
    });
  }

  try {
    const review = await localCodeReview(code, language || "Unknown");

    res.json({
      success: true,
      review,
      fileName: fileName || "GitHub file"
    });

  } catch (error) {
    console.log("GitHub review error:", error.message);

    res.status(500).json({
      error: "Unable to review GitHub file"
    });
  }
});

app.listen(PORT, () => {
  console.log(`CodeGuard AI server running on port ${PORT}`);
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Login failed"
    });
  }
});