const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const authRoutes = require("./routes/auth.routes");
const adminUserRoutes = require("./routes/adminUser.routes");
const courseRoutes = require("./routes/course.routes");
const testRoutes = require("./routes/test.routes");
const courseBatchRoutes = require("./routes/courseBatch.routes");
const courseInstructorRoutes = require("./routes/courseInstructor.routes");
const courseStudentRoutes = require("./routes/courseStudent.routes");
const courseModuleRoutes = require("./routes/courseModule.routes");
const lectureRoutes = require("./routes/lecture.routes");
const lectureNoteRoutes = require("./routes/lectureNote.routes");
const instructorRoutes = require("./routes/instructor.routes");
const studentRoutes = require("./routes/student.routes");
const adminInstructorPortalRoutes = require("./routes/adminInstructorPortal.routes");
const adminStudentPortalRoutes = require("./routes/adminStudentPortal.routes");
const quizRoutes = require("./routes/quiz.routes");
const studentQuizRoutes = require("./routes/studentQuiz.routes");

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Disable x-powered-by header for security and small bandwidth reduction
app.disable("x-powered-by");

// Enable Gzip/Deflate compression for all responses
app.use(
  compression({
    level: 6, // optimal balance of CPU and compression ratio
    threshold: 1024, // only compress responses > 1KB
  })
);

// CORS configuration (supports comma-separated origins or default fallback)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Fast Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "NSI IT LMS API is running",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/courses", courseRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/test", testRoutes);
app.use("/api/admin", courseBatchRoutes);
app.use("/api/admin", courseInstructorRoutes);
app.use("/api/admin", courseStudentRoutes);
app.use("/api/admin", adminInstructorPortalRoutes);
app.use("/api/admin", adminStudentPortalRoutes);
app.use("/api", courseModuleRoutes);
app.use("/api", lectureRoutes);
app.use("/api", lectureNoteRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/student", studentRoutes);
app.use("/api", quizRoutes);
app.use("/api/student", studentQuizRoutes);

// Catch 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  console.error("Unhandled Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "An unexpected server error occurred" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

module.exports = app;