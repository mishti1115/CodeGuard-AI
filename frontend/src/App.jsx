import { useState, useEffect } from "react";
import "./App.css";
import jsPDF from "jspdf";
import Editor from "@monaco-editor/react";

function Login({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      onLogin(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-icon">CG</div>

        <h1>Welcome Back</h1>
        <p>Login to CodeGuard AI</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="auth-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
                <p className="auth-switch">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
          >
            Sign up
          </button>
        </p>

      </div>
    </div>
  );
}
function Signup({ onSignup, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      onSignup(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-icon">CG</div>

        <h1>Create Account</h1>
        <p>Join CodeGuard AI</p>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="auth-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="auth-switch">
  Already have an account?{" "}
  <button
    type="button"
    onClick={onSwitchToLogin}
  >
    Login
  </button>
</p>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("Dashboard");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); 

  const menuItems = [
    "Dashboard",
    "Review Code",
    "History",
    "Analytics",
     "GitHub",
    "Settings",
  ];
    const [showSignup, setShowSignup] = useState(false);

    useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (savedToken && savedUser) {
    setUser(JSON.parse(savedUser));
    setIsLoggedIn(true);
  }
}, []);

if (!isLoggedIn) {
  if (showSignup) {
    return (
      <Signup
        onSignup={(newUser) => {
          setUser(newUser);
          setIsLoggedIn(true);
        }}
        onSwitchToLogin={() => setShowSignup(false)}
      />
    );
  }

  return (
    <Login
      onLogin={(loggedInUser) => {
        setUser(loggedInUser);
        setIsLoggedIn(true);
      }}
      onSwitchToSignup={() => setShowSignup(true)}
    />
  );
}

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">CG</div>

          <div>
            <h2>CodeGuard</h2>
            <span>AI Code Review</span>
          </div>
        </div>

        <nav>
          {menuItems.map((item) => (
            <a
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => setPage(item)}
            >
              {item}
            </a>
          ))}
        </nav>

       <div className="sidebar-bottom">
  <div className="user-avatar">MG</div>

  <div>
    <strong>{user?.name || "Developer"}</strong>
    <span>Free Plan</span>
  </div>

  <button
    className="logout-btn"
    onClick={() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsLoggedIn(false);
      setShowSignup(false);
    }}
  >
    Logout
  </button>
</div>
      </aside>

      <main className="main">
        {page === "Dashboard" && <Dashboard setPage={setPage} />}
        {page === "Review Code" && <ReviewCode />}
        {page === "History" && <History />}
        {page === "Analytics" && <Analytics />}
        {page === "Settings" && <Settings />}
        {page === "GitHub" && <GitHub />}
      </main>
    </div>
  );
}

function Dashboard({ setPage }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/reviews",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setReviews(data);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalReviews = reviews.length;

  const cppReviews = reviews.filter(
    (review) => review.language === "C++"
  ).length;

  const pythonReviews = reviews.filter(
    (review) => review.language === "Python"
  ).length;

  const javaReviews = reviews.filter(
    (review) => review.language === "Java"
  ).length;

  const javascriptReviews = reviews.filter(
    (review) => review.language === "JavaScript"
  ).length;

  return (
    <>
      <header className="topbar">

        <div>
          <p className="small-text">WELCOME BACK</p>

          <h1>Code Intelligence Dashboard</h1>
        </div>

        <button
          className="review-btn"
          onClick={() => setPage("Review Code")}
        >
          + New Code Review
        </button>

      </header>


      <section className="hero">

        <div>

          <p className="badge">
            AI-POWERED CODE ANALYSIS
          </p>

          <h2>
            Write better code.
            <br />
            Ship with confidence.
          </h2>

          <p>
            Detect bugs, security vulnerabilities, performance
            issues and improve your code with AI-powered analysis.
          </p>

          <button
            className="primary-btn"
            onClick={() => setPage("Review Code")}
          >
            Start Code Review →
          </button>

        </div>


        <div className="code-card">

          <div className="code-header">

            <span>main.cpp</span>

            <span className="status">
              ● AI Ready
            </span>

          </div>

          <pre>
{`int twoSum(vector<int>& nums, int target) {
    for(int i = 0; i < nums.size(); i++) {
        for(int j = i + 1; j < nums.size(); j++) {
            if(nums[i] + nums[j] == target)
                return i;
        }
    }
}`}
          </pre>

        </div>

      </section>


      <section className="stats">

        <Stat
          title="Total Reviews"
          value={loading ? "..." : totalReviews}
          text="Your analyzed reviews"
        />

        <Stat
          title="C++ Reviews"
          value={loading ? "..." : cppReviews}
          text="C++ code analyzed"
        />

        <Stat
          title="Python Reviews"
          value={loading ? "..." : pythonReviews}
          text="Python code analyzed"
        />

        <Stat
          title="Java Reviews"
          value={loading ? "..." : javaReviews}
          text="Java code analyzed"
        />

      </section>


      <section className="recent">

        <div className="section-heading">

          <div>

            <p className="small-text">
              ACTIVITY
            </p>

            <h2>
              Recent Code Reviews
            </h2>

          </div>

          <button
            className="view-btn"
            onClick={() => setPage("History")}
          >
            View All
          </button>

        </div>


        {loading ? (

          <div className="empty-state">
            <h3>Loading reviews...</h3>
          </div>

        ) : reviews.length === 0 ? (

          <div className="empty-state">

            <h3>No reviews yet</h3>

            <p>
              Start your first AI code review to see
              your activity here.
            </p>

          </div>

        ) : (

          reviews
            .slice(0, 3)
            .map((review) => (

              <ReviewItem
                key={review.id}
                file={`Code Review #${review.id}`}
                type={review.language}
                issues="AI analysis completed"
                score="✓"
              />

            ))

        )}

      </section>
    </>
  );
}


function Stat({ title, value, text }) {
  return (
    <div className="stat-card">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {text}
      </small>

    </div>
  );
}


function ReviewItem({
  file,
  type,
  issues,
  score
}) {
  return (
    <div className="review-item">

      <div className="file-icon">
        {type}
      </div>

      <div className="review-info">

        <strong>
          {file}
        </strong>

        <span>
          Recently • {issues}
        </span>

      </div>

      <div className="score good">
        {score}
      </div>

    </div>
  );
}



function ReviewCode() {
  const [code, setCode] = useState(
`#include <iostream>
using namespace std;

int main() {
    string password = "1234";

    for (int i = 0; i < 10; i++) {
        cout << i << endl;
    }

    return 0;
}`
  );

  const [language, setLanguage] = useState("C++");

  const [analyzed, setAnalyzed] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [testCases, setTestCases] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState(null);
  const [askLoading, setAskLoading] = useState(false);

  const [optimization, setOptimization] = useState(null);
  const [optimizeLoading, setOptimizeLoading] = useState(false);

  const analyzeCode = async () => {
    try {
      setLoading(true);
      setAnalyzed(false);
      setResult(null);

      const response = await fetch(
        "import.meta.env.VITE_API_URL/api/review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            code: code,
            language: language
          })
        }
      );

      const data = await response.json();

      setResult(data);
      setAnalyzed(true);

    } catch (error) {
      console.error(error);

      setResult({
        message: "Unable to connect to backend."
      });

      setAnalyzed(true);

    } finally {
      setLoading(false);
    }
  };

  const generateTestCases = async () => {
    try {
      setTestLoading(true);
      setTestCases(null);

      const response = await fetch(
        "http://localhost:5000/api/test-cases",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            code: code,
            language: language
          })
        }
      );

      const data = await response.json();

      setTestCases(data);

    } catch (error) {
      console.error(error);

      setTestCases({
        message: "Unable to connect to backend."
      });

    } finally {
      setTestLoading(false);
    }
  };

  const optimizeCode = async () => {
    try {
      setOptimizeLoading(true);
      setOptimization(null);

      const response = await fetch(
        "http://localhost:5000/api/optimize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            code: code,
            language: language
          })
        }
      );

      const data = await response.json();

      setOptimization(data);

    } catch (error) {
      console.error(error);

      setOptimization({
        message: "Unable to connect to backend."
      });

    } finally {
      setOptimizeLoading(false);
    }
  };

  const askAI = async () => {
    if (!askQuestion.trim()) {
      return;
    }

    try {
      setAskLoading(true);
      setAskAnswer(null);

      const response = await fetch(
        "http://localhost:5000/api/ask-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            code: code,
            language: language,
            question: askQuestion
          })
        }
      );

      const data = await response.json();

      setAskAnswer(data);

    } catch (error) {
      console.error(error);

      setAskAnswer({
        answer: "Unable to connect to backend."
      });

    } finally {
      setAskLoading(false);
    }
  };

  const getReviewText = () => {
    return result?.review || result?.message || "";
  };

  const reviewText = getReviewText();

  const getSection = (title) => {
    const text = reviewText;

    const start = text.toLowerCase().indexOf(title.toLowerCase());

    if (start === -1) {
      return "No information available.";
    }

    const remaining = text.substring(start + title.length);

    const nextSection = remaining.search(
      /\n\s*(Security|Performance|Code Quality|Time Complexity|Space Complexity|Recommendation|Bugs?|Issues?)/i
    );

    if (nextSection === -1) {
      return remaining.trim();
    }

    return remaining.substring(0, nextSection).trim();
  };

  const bugSection =
    getSection("Bugs") ||
    getSection("Bug") ||
    getSection("Issues");

  const securitySection =
    getSection("Security");

  const performanceSection =
    getSection("Performance");

  const qualitySection =
    getSection("Code Quality");

  const timeSection =
    getSection("Time Complexity");

  const spaceSection =
    getSection("Space Complexity");

  const recommendationSection =
    getSection("Recommendation");

    const getScore = (section, type) => {
  const text = section.toLowerCase();

  if (text.includes("no issue") || text.includes("no vulnerability")) {
    return 95;
  }

  if (type === "bug") {
    if (text.includes("error") || text.includes("bug")) return 55;
    return 85;
  }

  if (type === "security") {
    if (
      text.includes("password") ||
      text.includes("api key") ||
      text.includes("vulnerability")
    ) {
      return 50;
    }
    return 90;
  }

  if (type === "performance") {
    if (text.includes("nested loop") || text.includes("inefficient")) {
      return 65;
    }
    return 88;
  }

  if (type === "quality") {
    if (
      text.includes("poor") ||
      text.includes("duplicate") ||
      text.includes("unused")
    ) {
      return 65;
    }
    return 90;
  }

  return 80;
};

const bugScore = getScore(bugSection, "bug");
const securityScore = getScore(securitySection, "security");
const performanceScore = getScore(performanceSection, "performance");
const qualityScore = getScore(qualitySection, "quality");

const overallScore = Math.round(
  (bugScore + securityScore + performanceScore + qualityScore) / 4
);

  return (
    <>
      <header className="topbar">
        <div>
          <p className="small-text">AI CODE ANALYSIS</p>
          <h1>Review Your Code</h1>
        </div>
      </header>

      <section className="review-workspace">

        <div className="editor-panel">

          <div className="editor-header">

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>C++</option>
              <option>JavaScript</option>
              <option>Python</option>
              <option>Java</option>
              <option>C</option>
            </select>

            <span>
              {loading
                ? "● Analyzing..."
                : optimizeLoading
                ? "● Optimizing..."
                : "● Ready to analyze"}
            </span>

          </div>

          <Editor
            height="400px"
            theme="vs-dark"
            language={
              language === "C++"
                ? "cpp"
                : language === "Java"
                ? "java"
                : language === "Python"
                ? "python"
                : language === "C"
                ? "c"
                : "javascript"
            }
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
              wordWrap: "on",
              scrollBeyondLastLine: false
            }}
          />

          <div className="editor-footer">

            <span>{language}</span>

            <div>

              <button
                className="analyze-btn"
                onClick={analyzeCode}
                disabled={loading}
              >
                {loading
                  ? "Analyzing..."
                  : "✨ Analyze Code"}
              </button>

              <button
                className="analyze-btn"
                onClick={optimizeCode}
                disabled={optimizeLoading}
                style={{ marginLeft: "10px" }}
              >
                {optimizeLoading
                  ? "Optimizing..."
                  : "⚡ Optimize Code"}
              </button>

             <button
  className="analyze-btn"
  onClick={() => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("CodeGuard AI - Code Review Report", 20, 20);

    doc.setFontSize(11);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      20,
      30
    );

    let y = 45;

    const sections = [
      ["Bugs", bugSection],
      ["Security", securitySection],
      ["Performance", performanceSection],
      ["Code Quality", qualitySection],
      ["Time Complexity", timeSection],
      ["Space Complexity", spaceSection],
      ["Recommendation", recommendationSection]
    ];

    sections.forEach(([title, content]) => {
      if (!content) return;

      doc.setFontSize(14);
      doc.text(title, 20, y);
      y += 8;

      doc.setFontSize(10);

      const lines = doc.splitTextToSize(content, 170);

      lines.forEach((line) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        doc.text(line, 20, y);
        y += 5;
      });

      y += 8;
    });

    doc.setFontSize(14);
    doc.text(
      `Overall Code Quality: ${overallScore}/100`,
      20,
      y
    );

    doc.save("CodeGuard-AI-Review-Report.pdf");
  }}
>
  📄 Export Review Report
</button>

              <button
                className="analyze-btn"
                onClick={generateTestCases}
                disabled={testLoading}
                style={{ marginLeft: "10px" }}
              >
                {testLoading
                  ? "Generating..."
                  : "🧪 Generate Test Cases"}
              </button>

              <div style={{ marginTop: "20px" }}>

                <input
                  type="text"
                  placeholder="Ask something about your code..."
                  value={askQuestion}
                  onChange={(e) =>
                    setAskQuestion(e.target.value)
                  }
                  style={{
                    width: "70%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #444",
                    background: "#111",
                    color: "white"
                  }}
                />

                <button
                  className="analyze-btn"
                  onClick={askAI}
                  disabled={askLoading}
                  style={{ marginLeft: "10px" }}
                >
                  {askLoading
                    ? "Thinking..."
                    : "🤖 Ask AI"}
                </button>

              </div>

              {askAnswer && (
                <div className="analysis-result">

                  <h3>🤖 AI Answer</h3>

                  <pre>
                    {askAnswer.answer ||
                      "No answer available."}
                  </pre>

                </div>
              )}

            </div>

          </div>

        </div>

        <div className="ai-panel">

          <div className="ai-title">

            <div className="ai-icon">
              AI
            </div>

            <div>
              <h2>AI Code Review</h2>

              <span>
                Powered by CodeGuard Intelligence
              </span>
            </div>

          </div>

          {!analyzed ? (

            <div className="empty-review">

              <div className="empty-icon">
                ⌁
              </div>

              <h3>Ready to analyze</h3>

              <p>
                Submit your code to detect bugs, security
                vulnerabilities and optimization opportunities.
              </p>

            </div>

          ) : (

            <>
              <div className="review-summary-grid">
                <div className="score-overview">
  <div className="score-item">
    <span>🐛 BUGS</span>
    <strong>{bugScore}/100</strong>
  </div>

  <div className="score-item">
    <span>🔒 SECURITY</span>
    <strong>{securityScore}/100</strong>
  </div>

  <div className="score-item">
    <span>⚡ PERFORMANCE</span>
    <strong>{performanceScore}/100</strong>
  </div>

  <div className="score-item">
    <span>✨ QUALITY</span>
    <strong>{qualityScore}/100</strong>
  </div>
</div>

                <div className="review-card bug-card">
                  <span>🐛</span>
                  <strong>Bugs</strong>
                  <p>{bugSection}</p>
                </div>

                <div className="review-card security-card">
                  <span>🔐</span>
                  <strong>Security</strong>
                  <p>{securitySection}</p>
                </div>

                <div className="review-card performance-card">
                  <span>⚡</span>
                  <strong>Performance</strong>
                  <p>{performanceSection}</p>
                </div>

                <div className="review-card quality-card">
                  <span>✨</span>
                  <strong>Code Quality</strong>
                  <p>{qualitySection}</p>
                </div>

              </div>

              <div className="complexity-grid">

                <div className="complexity-card">
                  <span>TIME COMPLEXITY</span>
                  <strong>{timeSection}</strong>
                </div>

                <div className="complexity-card">
                  <span>SPACE COMPLEXITY</span>
                  <strong>{spaceSection}</strong>
                </div>

              </div>

              <div className="analysis-result">

                <div className="quality-score">
  <span>OVERALL CODE QUALITY</span>
  <strong>{overallScore}/100</strong>
</div>

                <div className="issue-box info">

                  <strong>💡 Recommendation</strong>

                  <div className="review-result">

                    <pre>
                      {recommendationSection}
                    </pre>

                  </div>

                </div>

                <div className="issue-box info">

                  <strong>📋 Complete AI Report</strong>

                  <div className="review-result">

                    <pre>
                      {reviewText}
                    </pre>

                  </div>

                </div>

              </div>
            </>
          )}

          {optimization && (

            <div className="analysis-result">

              <div className="quality-score">

                <span>OPTIMIZATION</span>

                <strong>Code Improvement</strong>

              </div>

              <div className="issue-box info">

                <strong>
                  ⚡ Optimization Report
                </strong>

                <div className="review-result">

                  <pre>
                    {optimization?.optimization ||
                      optimization?.message ||
                      "No optimization available."}
                  </pre>

                </div>

              </div>

            </div>

          )}

         {testCases && (
  <div className="analysis-result">

    <div className="quality-score">
      <span>TESTING</span>
      <strong>Generated Test Cases</strong>
    </div>

    <div className="issue-box info">

      <strong>🧪 AI Generated Test Cases</strong>

      <div className="review-result test-case-result">
        <pre>
          {testCases?.testCases ||
            testCases?.message ||
            "No test cases available."}
        </pre>
      </div>

    </div>

  </div>
)}

        </div>

      </section>
    </>
  );
}

function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReview, setSelectedReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [language, setLanguage] = useState("All");

  const totalReviews = reviews.length;

  const exportReviewPDF = (review) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("CodeGuard AI - Code Review Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Review ID: ${review.id}`, 20, 35);
    doc.text(`Language: ${review.language}`, 20, 45);

    doc.setFontSize(14);
    doc.text("Submitted Code", 20, 60);

    doc.setFontSize(10);

    const codeLines = doc.splitTextToSize(
      review.code || "",
      170
    );

    doc.text(codeLines, 20, 70);

    let y = 70 + codeLines.length * 5 + 15;

    doc.setFontSize(14);
    doc.text("Code Review", 20, y);

    y += 10;

    doc.setFontSize(10);

    const reviewLines = doc.splitTextToSize(
      review.review || "",
      170
    );

    doc.text(reviewLines, 20, y);

    doc.save(`CodeGuard-Review-${review.id}.pdf`);
  };

  const cppReviews = reviews.filter(
    (review) => review.language === "C++"
  ).length;

  const pythonReviews = reviews.filter(
    (review) => review.language === "Python"
  ).length;

  const javaReviews = reviews.filter(
    (review) => review.language === "Java"
  ).length;

  const deleteReview = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/reviews/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      setReviews((prevReviews) =>
        prevReviews.filter((review) => review.id !== id)
      );

      setSelectedReview(null);
    } catch (error) {
      console.error(error);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/reviews",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      console.log("HISTORY STATUS:", response.status);
      console.log("HISTORY DATA:", data);

      if (!response.ok) {
        console.error("Reviews API Error:", data);
        setReviews([]);
        return;
      }

      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("HISTORY ERROR:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <span className="eyebrow">REVIEW HISTORY</span>

          <h1>Previous Reviews</h1>

          <p>
            View your previously analyzed code reviews.
          </p>
        </div>
      </div>

      <div className="analytics-grid">

        <div className="analytics-card">
          <span>Total Reviews</span>
          <strong>{totalReviews}</strong>
        </div>

        <div className="analytics-card">
          <span>C++ Reviews</span>
          <strong>{cppReviews}</strong>
        </div>

        <div className="analytics-card">
          <span>Python Reviews</span>
          <strong>{pythonReviews}</strong>
        </div>

        <div className="analytics-card">
          <span>Java Reviews</span>
          <strong>{javaReviews}</strong>
        </div>

      </div>

      <div className="history-search">

        <input
          type="text"
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="All">All Languages</option>
          <option value="C++">C++</option>
          <option value="C">C</option>
          <option value="Java">Java</option>
          <option value="Python">Python</option>
          <option value="JavaScript">JavaScript</option>
        </select>

      </div>

      {selectedReview && (

        <div className="history-detail">

          <button
            onClick={() => setSelectedReview(null)}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => deleteReview(selectedReview.id)}
          >
            🗑️ Delete Review
          </button>

          <button
            type="button"
            onClick={() => exportReviewPDF(selectedReview)}
          >
            📄 Export PDF
          </button>

          <h2>
            Code Review #{selectedReview.id}
          </h2>

          <p>
            <strong>Language:</strong>{" "}
            {selectedReview.language}
          </p>

          <h3>Submitted Code</h3>

          <pre>
            {selectedReview.code}
          </pre>

          <h3>Review</h3>

          <pre>
            {selectedReview.review}
          </pre>

          <p>
            {new Date(
              selectedReview.created_at
            ).toLocaleString()}
          </p>

        </div>

      )}

      {loading ? (

        <div className="empty-state">
          <h3>Loading reviews...</h3>
        </div>

      ) : reviews.length === 0 ? (

        <div className="empty-state">
          <h3>No reviews yet</h3>

          <p>
            Your analyzed code will appear here.
          </p>
        </div>

      ) : (

        <div className="history-list">

          {reviews
            .filter((review) => {

              const matchesSearch =
                review.language
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                review.review
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase());

              const matchesLanguage =
                language === "All" ||
                review.language === language;

              return matchesSearch && matchesLanguage;
            })

            .map((review) => (

              <div
                className="history-card"
                key={review.id}
                onClick={() => setSelectedReview(review)}
                style={{ cursor: "pointer" }}
              >

                <div>

                  <span className="history-language">
                    {review.language}
                  </span>

                  <h3>
                    Code Review #{review.id}
                  </h3>

                  <p>
                    {review.review
                      ? review.review.slice(0, 180)
                      : "No review available."}

                    {review.review?.length > 180
                      ? "..."
                      : ""}
                  </p>

                </div>

                <span className="history-date">
                  {new Date(
                    review.created_at
                  ).toLocaleString()}
                </span>

              </div>

            ))}

        </div>

      )}

    </div>
  );
}

function Analytics() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/reviews",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Analytics API Error:", data);
          setReviews([]);
          return;
        }

        setReviews(Array.isArray(data) ? data : []);

      } catch (error) {
        console.error("ANALYTICS ERROR:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const totalReviews = reviews.length;

  const languageCount = reviews.reduce(
    (acc, review) => {
      acc[review.language] =
        (acc[review.language] || 0) + 1;

      return acc;
    },
    {}
  );

  const mostUsedLanguage =
    Object.keys(languageCount).length > 0
      ? Object.entries(languageCount).sort(
          (a, b) => b[1] - a[1]
        )[0][0]
      : "—";

  return (
    <div className="page">

      <div className="page-header">
        <div>

          <span className="eyebrow">
            DEVELOPER ANALYTICS
          </span>

          <h1>Code Review Analytics</h1>

          <p>
            Track your code review activity and languages.
          </p>

        </div>
      </div>

      {loading ? (

        <div className="empty-state">
          <h3>Loading analytics...</h3>
        </div>

      ) : (

        <>

          <div className="stats-grid">

            <div className="stat-card">
              <span>Total Reviews</span>
              <strong>{totalReviews}</strong>
              <small>All-time reviews</small>
            </div>

            <div className="stat-card">
              <span>Languages</span>
              <strong>
                {Object.keys(languageCount).length}
              </strong>
              <small>Languages reviewed</small>
            </div>

            <div className="stat-card">
              <span>Most Used</span>
              <strong>{mostUsedLanguage}</strong>
              <small>Most reviewed language</small>
            </div>

            <div className="stat-card">
              <span>Status</span>
              <strong>Active</strong>
              <small>CodeGuard AI</small>
            </div>

          </div>

          <div className="analytics-section">

            <h2>Language Breakdown</h2>

            {Object.keys(languageCount).length === 0 ? (

              <div className="empty-state">
                <h3>No analytics data yet</h3>

                <p>
                  Complete an AI code review to see
                  your statistics.
                </p>
              </div>

            ) : (

              <div className="language-list">

                {Object.entries(languageCount).map(
                  ([language, count]) => (

                    <div
                      className="language-row"
                      key={language}
                    >

                      <span>{language}</span>

                      <strong>
                        {count} review
                        {count !== 1 ? "s" : ""}
                      </strong>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </>

      )}

    </div>
  );
}

function Settings() {
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [securityScanning, setSecurityScanning] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <>
      <header className="topbar">
        <div>
          <p className="small-text">ACCOUNT</p>
          <h1>Settings</h1>
        </div>
      </header>

      <section className="page-card">
        <h2>Account Information</h2>

        <div className="setting-row">
          <div>
            <strong>Name</strong>
            <span>{user?.name || "User"}</span>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <strong>Email</strong>
            <span>{user?.email || "Not available"}</span>
          </div>
        </div>
      </section>

      <section className="page-card">
        <h2>Project Settings</h2>

        <div className="setting-row">
          <div>
            <strong>AI Code Analysis</strong>
            <span>
              Automatically analyze submitted code.
            </span>
          </div>

          <button
            className={`toggle ${aiAnalysis ? "active" : ""}`}
            onClick={() => setAiAnalysis(!aiAnalysis)}
          >
            {aiAnalysis ? "ON" : "OFF"}
          </button>
        </div>

        <div className="setting-row">
          <div>
            <strong>Security Scanning</strong>
            <span>
              Detect common security vulnerabilities.
            </span>
          </div>

          <button
            className={`toggle ${securityScanning ? "active" : ""}`}
            onClick={() => setSecurityScanning(!securityScanning)}
          >
            {securityScanning ? "ON" : "OFF"}
          </button>
        </div>

        <div className="setting-row">
          <div>
            <strong>Auto Save</strong>
            <span>
              Automatically save your code while working.
            </span>
          </div>

          <button
            className={`toggle ${autoSave ? "active" : ""}`}
            onClick={() => setAutoSave(!autoSave)}
          >
            {autoSave ? "ON" : "OFF"}
          </button>
        </div>
      </section>

      <section className="page-card">
        <h2>About CodeGuard AI</h2>

        <div className="setting-row">
          <div>
            <strong>Version</strong>
            <span>CodeGuard AI v1.0</span>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <strong>Platform</strong>
            <span>AI Powered Code Review Assistant</span>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
function GitHub() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repo, setRepo] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [githubReview, setGithubReview] = useState("");

  const [error, setError] = useState("");

  const connectRepository = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setFilesLoading(false);
    setError("");
    setRepo(null);
    setFiles([]);
    setSelectedFile(null);
    setGithubReview("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/github/repo?repo=${encodeURIComponent(repoUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to connect repository");
      }

      setRepo(data.repository);

      setFilesLoading(true);

      const filesResponse = await fetch(
        `http://localhost:5000/api/github/files?repo=${encodeURIComponent(repoUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const filesData = await filesResponse.json();

      if (!filesResponse.ok) {
        throw new Error(
          filesData.error || "Unable to fetch repository files"
        );
      }

      setFiles(filesData.files || []);

    } catch (error) {
      setError(error.message);
    } finally {
      setFilesLoading(false);
      setLoading(false);
    }
  };

  const openFile = async (file) => {
    if (file.type !== "file") {
      return;
    }

    setFileLoading(true);
    setError("");
    setSelectedFile(null);
    setGithubReview("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/github/file?repo=${encodeURIComponent(
          repoUrl
        )}&path=${encodeURIComponent(file.path)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to open file");
      }

      setSelectedFile(data.file);

    } catch (error) {
      setError(error.message);
    } finally {
      setFileLoading(false);
    }
  };

  const reviewGithubFile = async () => {
    if (!selectedFile) {
      return;
    }

    setReviewLoading(true);
    setError("");
    setGithubReview("");

    try {
      const token = localStorage.getItem("token");

      const extension = selectedFile.name
        .split(".")
        .pop()
        .toLowerCase();

      const languageMap = {
        js: "JavaScript",
        jsx: "JavaScript",
        ts: "TypeScript",
        tsx: "TypeScript",
        py: "Python",
        cpp: "C++",
        cc: "C++",
        cxx: "C++",
        c: "C",
        java: "Java",
        cs: "C#",
        go: "Go",
        rs: "Rust",
        php: "PHP"
      };

      const language = languageMap[extension] || "Unknown";

      const response = await fetch(
        "http://localhost:5000/api/github/review",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            code: selectedFile.content,
            language: language,
            fileName: selectedFile.name
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to review GitHub file");
      }

      setGithubReview(data.review);

    } catch (error) {
      setError(error.message);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <p className="small-text">INTEGRATION</p>
          <h1>GitHub</h1>
        </div>
      </header>

      <section className="page-card github-card">

        <h2>Connect GitHub Repository</h2>

        <p className="github-description">
          Enter a public GitHub repository URL to analyze repository
          information and browse its files.
        </p>

        <div className="github-input-row">

          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
          />

          <button
            className="analyze-btn"
            onClick={connectRepository}
            disabled={loading}
          >
            {loading ? "Connecting..." : "Connect"}
          </button>

        </div>

        {error && (
          <div className="github-error">
            {error}
          </div>
        )}

        {repo && (
          <div className="github-repo-result">

            <div className="github-repo-header">

              <div>
                <p className="small-text">REPOSITORY</p>
                <h2>{repo.name}</h2>
              </div>

              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub ↗
              </a>

            </div>

            <p className="github-repo-description">
              {repo.description ||
                "No repository description available."}
            </p>

            <div className="github-stats">

              <div>
                <span>LANGUAGE</span>
                <strong>{repo.language || "N/A"}</strong>
              </div>

              <div>
                <span>⭐ STARS</span>
                <strong>{repo.stars}</strong>
              </div>

              <div>
                <span>🍴 FORKS</span>
                <strong>{repo.forks}</strong>
              </div>

              <div>
                <span>BRANCH</span>
                <strong>{repo.defaultBranch}</strong>
              </div>

            </div>

            <div className="github-files-section">

              <div className="github-files-header">

                <div>
                  <p className="small-text">
                    REPOSITORY CONTENT
                  </p>

                  <h3>Files</h3>
                </div>

                {filesLoading && (
                  <span className="github-loading">
                    Loading files...
                  </span>
                )}

              </div>

              {!filesLoading && files.length === 0 && (
                <div className="github-empty">
                  No files found.
                </div>
              )}

              {!filesLoading && files.length > 0 && (
                <div className="github-file-list">

                  {files.map((file) => (

                    <div
                      className="github-file-item"
                      key={file.path}
                    >

                      <span className="github-file-icon">
                        {file.type === "dir"
                          ? "📁"
                          : "📄"}
                      </span>

                      <div className="github-file-info">

                        <strong>{file.name}</strong>

                        <span>
                          {file.path}
                        </span>

                      </div>

                      {file.type === "file" ? (

                        <button
                          className="github-open-btn"
                          onClick={() => openFile(file)}
                        >
                          Open
                        </button>

                      ) : (

                        <span className="github-file-type">
                          Folder
                        </span>

                      )}

                    </div>

                  ))}

                </div>
              )}

            </div>

            {fileLoading && (
              <div className="github-file-viewer">

                <div className="github-viewer-header">
                  <span>Loading file...</span>
                </div>

              </div>
            )}

            {selectedFile && !fileLoading && (

              <div className="github-file-viewer">

                <div className="github-viewer-header">

                  <div>
                    <p className="small-text">
                      OPEN FILE
                    </p>

                    <h3>
                      {selectedFile.name}
                    </h3>
                  </div>

                  <span>
                    {selectedFile.path}
                  </span>

                </div>

                <pre className="github-code-viewer">
                  <code>
                    {selectedFile.content}
                  </code>
                </pre>
<div className="github-review-action">

  <button
    className="analyze-btn"
    onClick={reviewGithubFile}
    disabled={reviewLoading}
  >
    {reviewLoading
      ? "Reviewing Code..."
      : "🤖 Review with CodeGuard AI"}
  </button>

  <button
    className="optimize-btn"
    onClick={async () => {
      if (!selectedFile) return;

      try {
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/optimize",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              code: selectedFile.content
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to optimize code"
          );
        }

        setGithubReview(
          `OPTIMIZED CODE\n\n${data.optimizedCode || data.optimized || data.result}`
        );

      } catch (error) {
        setError(error.message);
      }
    }}
  >
    ⚡ Optimize Code
  </button>

</div>
              </div>
            )}

            {githubReview && (

              <div className="github-review-result">

                <div className="github-review-header">
                  <div>
                    <p className="small-text">
                      CODEGUARD AI
                    </p>

                    <h3>
                      AI Code Review
                    </h3>
                  </div>
                </div>

                <div className="github-review-content">
                  {githubReview}
                </div>

              </div>
            )}

          </div>
        )}

      </section>
    </>
  );
}