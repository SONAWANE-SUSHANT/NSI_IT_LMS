const fs = require("fs");
const path = require("path");
const YAML = require("yamljs");

const doc = {
  openapi: "3.0.3",
  info: {
    title: "NSI-IT-LMS API Documentation",
    description: "Complete, production-ready REST API documentation for the NSI IT Learning Management System (Nityashree Infosystems LMS). Includes Authentication, Role-based User Management, Courses, Modules, Lectures & Notes, Cohort Batches & Allocations, Quizzes & Judge0 Code Execution, Schedules, Reviews, Announcements, Notifications, Platform Settings, and Reporting Hub.",
    version: "1.0.0",
    contact: {
      name: "NSI IT Support",
      email: "support@nsiit.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "System", description: "System health check" },
    { name: "Authentication", description: "User login and session lifecycle" },
    { name: "Profile", description: "Personal profile details and avatar management" },
    { name: "Admin Users", description: "CRUD operations for system users, CSV import, and device controls" },
    { name: "Admin Portal Views", description: "Administrative impersonation of faculty and students" },
    { name: "Courses", description: "Course catalog operations" },
    { name: "Modules", description: "Course syllabus modules" },
    { name: "Lectures", description: "Module lecture sessions (live and recorded)" },
    { name: "Lecture Notes", description: "Lecture attachments and materials" },
    { name: "Batches", description: "Student cohort batches" },
    { name: "Batch Instructors", description: "Assigning instructors to cohort batches" },
    { name: "Batch Students", description: "Enrolling students into cohort batches" },
    { name: "Instructor Portal", description: "Faculty batch management, live sessions, announcements, and reviews" },
    { name: "Student Portal", description: "Student enrolled courses, curriculum player, progress tracking, announcements, and reviews" },
    { name: "Quizzes (Admin & Instructor)", description: "Quiz authoring, MCQ and coding questions, options, and submission reviews" },
    { name: "Student Quizzes & Assessment", description: "Student quiz taking, Judge0 code execution, submission, and scorecard results" },
    { name: "Course Reviews", description: "Course ratings and moderation" },
    { name: "Announcements", description: "Academy, course, and batch broadcast notices" },
    { name: "Notifications", description: "User notifications and read receipts" },
    { name: "Reports & Analytics", description: "Administrative reporting, KPI metrics, and student dossiers" },
    { name: "Platform Settings", description: "Global LMS configuration and academic parameters" },
    { name: "RBAC Test", description: "Role validation test routes" },
  ],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter standard JWT Bearer token: Bearer <token>",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" },
        },
      },
      ApiErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid or expired authentication token" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          first_name: { type: "string", example: "Rahul" },
          last_name: { type: "string", example: "Sharma" },
          email: { type: "string", format: "email", example: "rahul.sharma@nsiit.com" },
          username: { type: "string", example: "rahul.sharma@nsi" },
          role_id: { type: "integer", enum: [1, 2, 3], example: 3, description: "1: ADMIN, 2: INSTRUCTOR, 3: STUDENT" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], example: "ACTIVE" },
          contact_no: { type: "string", example: "9876543210" },
          gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"], example: "MALE" },
          date_of_birth: { type: "string", format: "date", example: "2000-01-15" },
          photo: { type: "string", nullable: true, example: null },
        },
      },
      Course: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          code: { type: "string", example: "FS-MERN" },
          name: { type: "string", example: "Full Stack Web Development (MERN)" },
          description: { type: "string", example: "Comprehensive full stack JavaScript curriculum" },
          thumbnail_url: { type: "string", nullable: true, example: "https://example.com/thumb.jpg" },
          duration: { type: "string", example: "6 Months" },
          status: { type: "string", enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"], example: "ACTIVE" },
        },
      },
      CourseBatch: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Alpha Batch" },
          course_id: { type: "integer", example: 1 },
          batch_code: { type: "string", example: "Alpha Batch-JAN-2026" },
          start_date: { type: "string", format: "date", example: "2026-01-15" },
          end_date: { type: "string", format: "date", nullable: true, example: "2026-07-15" },
          batch_mode: { type: "string", enum: ["ONLINE", "OFFLINE", "HYBRID"], example: "ONLINE" },
          batch_time: { type: "string", enum: ["MORNING", "EVENING"], example: "MORNING" },
          batch_schedule: { type: "string", enum: ["WEEKDAYS", "WEEKENDS"], example: "WEEKDAYS" },
          status: { type: "string", enum: ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"], example: "ACTIVE" },
        },
      },
      CourseModule: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          course_id: { type: "integer", example: 1 },
          name: { type: "string", example: "Module 1: React Fundamentals" },
          description: { type: "string", example: "JSX, props, state, and hooks" },
          display_order: { type: "integer", example: 1 },
          duration: { type: "string", example: "3 Weeks" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "ACTIVE" },
        },
      },
      Lecture: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          module_id: { type: "integer", example: 1 },
          instructor_id: { type: "integer", nullable: true, example: 2 },
          title: { type: "string", example: "Lecture 1: Introduction to Components" },
          description: { type: "string", example: "Component hierarchy and virtual DOM" },
          session_type: { type: "string", enum: ["LIVE", "RECORDED"], example: "LIVE" },
          status: { type: "string", enum: ["DRAFT", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED", "PUBLISHED"], example: "PUBLISHED" },
          display_order: { type: "integer", example: 1 },
          session_url: { type: "string", nullable: true, example: "https://meet.google.com/abc-defg-hij" },
          recording_url: { type: "string", nullable: true, example: "https://drive.google.com/rec" },
          duration_minutes: { type: "integer", nullable: true, example: 90 },
        },
      },
      LectureNote: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          session_id: { type: "integer", example: 1 },
          title: { type: "string", example: "React Cheatsheet" },
          note_type: { type: "string", enum: ["PDF", "PPT", "DOC", "EXCEL", "ZIP", "CODE", "LINK", "OTHER"], example: "PDF" },
          file_url: { type: "string", nullable: true, example: "https://example.com/notes.pdf" },
          external_url: { type: "string", nullable: true, example: null },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "ACTIVE" },
        },
      },
      Quiz: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          session_id: { type: "integer", nullable: true, example: null },
          module_id: { type: "integer", nullable: true, example: 1 },
          course_id: { type: "integer", nullable: true, example: 1 },
          title: { type: "string", example: "React Hooks & State Test" },
          description: { type: "string", example: "Assess understanding of useState and useEffect" },
          duration_minutes: { type: "integer", example: 45 },
          total_marks: { type: "number", example: 50.0 },
          passing_marks: { type: "number", example: 20.0 },
          max_attempts: { type: "integer", example: 2 },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"], example: "PUBLISHED" },
        },
      },
      QuizQuestion: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          quiz_id: { type: "integer", example: 1 },
          question_type: { type: "string", enum: ["MCQ", "CODING"], example: "MCQ" },
          question_text: { type: "string", example: "Which hook is used for side effects in React?" },
          marks: { type: "number", example: 5.0 },
          display_order: { type: "integer", example: 1 },
          difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"], example: "MEDIUM" },
          programming_language: { type: "string", nullable: true, example: "javascript" },
          starter_code: { type: "string", nullable: true, example: null },
          expected_output: { type: "string", nullable: true, example: null },
          constraints: { type: "string", nullable: true, example: null },
        },
      },
      QuizAttempt: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          quiz_id: { type: "integer", example: 1 },
          student_id: { type: "integer", example: 3 },
          attempt_number: { type: "integer", example: 1 },
          status: { type: "string", enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "CANCELLED"], example: "SUBMITTED" },
          score: { type: "number", example: 45.0 },
          total_marks: { type: "number", example: 50.0 },
          passed: { type: "boolean", example: true },
          started_at: { type: "string", format: "date-time" },
          submitted_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      Announcement: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Guest Lecture Schedule" },
          message: { type: "string", example: "Special industry session on Cloud Architecture." },
          course_id: { type: "integer", nullable: true, example: null },
          batch_id: { type: "integer", nullable: true, example: null },
          status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], example: "PUBLISHED" },
          published_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "integer", example: 1 },
          title: { type: "string", example: "New Announcement Published" },
          message: { type: "string", example: "A new announcement was posted." },
          notification_type: { type: "string", example: "ANNOUNCEMENT" },
          is_read: { type: "boolean", example: false },
          read_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      CourseReview: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          course_id: { type: "integer", example: 1 },
          student_id: { type: "integer", example: 3 },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          review: { type: "string", example: "Great course with practical real-world exercises." },
          status: { type: "string", enum: ["ACTIVE", "HIDDEN"], example: "ACTIVE" },
        },
      },
      PlatformSetting: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          setting_key: { type: "string", example: "platform_title" },
          setting_value: { type: "string", example: "NSI IT LMS - Nityashree Infosystems" },
          category: { type: "string", enum: ["GENERAL", "ACADEMIC", "SECURITY", "NOTIFICATION"], example: "GENERAL" },
          description: { type: "string", example: "Display name of the LMS platform" },
        },
      },
    },
  },
};

// Helper to quickly register endpoints
function addPath(pathUrl, method, config) {
  if (!doc.paths[pathUrl]) {
    doc.paths[pathUrl] = {};
  }
  doc.paths[pathUrl][method.toLowerCase()] = config;
}

// -------------------------------------------------------------
// 1. SYSTEM
// -------------------------------------------------------------
addPath("/api/health", "get", {
  tags: ["System"],
  summary: "API Health Check",
  description: "Check if the server and API are operational.",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "NSI IT LMS API is running" },
              uptime: { type: "number", example: 123.45 },
              timestamp: { type: "number", example: 1773484800000 },
            },
          },
        },
      },
    },
  },
});

// -------------------------------------------------------------
// 2. AUTHENTICATION
// -------------------------------------------------------------
addPath("/api/auth/login", "post", {
  tags: ["Authentication"],
  summary: "User Login",
  description: "Authenticate with username or email along with password. Enforces device limits for student logins and returns JWT token.",
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string", example: "admin@nsiit.com", description: "Username or email" },
            password: { type: "string", example: "Admin@123" },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Login successful" },
              data: {
                type: "object",
                properties: {
                  token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  user: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
    },
    401: {
      description: "Invalid credentials or account suspended",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } },
    },
    403: {
      description: "Student device limit exceeded",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } },
    },
  },
});

// -------------------------------------------------------------
// 3. PROFILE
// -------------------------------------------------------------
addPath("/api/profile", "get", {
  tags: ["Profile"],
  summary: "Get current user profile",
  description: "Retrieve profile details of the authenticated user.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User profile details",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
    },
    401: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } } },
  },
});

addPath("/api/profile", "put", {
  tags: ["Profile"],
  summary: "Update current user profile",
  description: "Update personal profile information such as contact number, DOB, or gender.",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            contact_no: { type: "string", example: "9876543210" },
            date_of_birth: { type: "string", format: "date", example: "1998-05-20" },
            gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"], example: "MALE" },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Profile updated successfully",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
    },
  },
});

addPath("/api/profile/photo", "put", {
  tags: ["Profile"],
  summary: "Upload profile photo",
  description: "Upload base64 encoded photo string or image URL for profile picture.",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["photo"],
          properties: {
            photo: { type: "string", example: "data:image/png;base64,iVBORw0KGgoAAA..." },
          },
        },
      },
    },
  },
  responses: {
    200: { description: "Photo updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
  },
});

// -------------------------------------------------------------
// 4. ADMIN USERS
// -------------------------------------------------------------
addPath("/api/admin/users", "get", {
  tags: ["Admin Users"],
  summary: "List all users",
  description: "Administrator endpoint to retrieve users with filtering by role_id, status, and search query.",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "role_id", in: "query", schema: { type: "integer" }, description: "Filter by role ID (1: Admin, 2: Instructor, 3: Student)" },
    { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] } },
    { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, email, or contact number" },
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
  ],
  responses: {
    200: {
      description: "List of users with pagination",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  total: { type: "integer", example: 45 },
                  totalPages: { type: "integer", example: 5 },
                  currentPage: { type: "integer", example: 1 },
                  users: { type: "array", items: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
        },
      },
    },
    403: { description: "Forbidden - Requires Admin role" },
  },
});

addPath("/api/admin/users", "post", {
  tags: ["Admin Users"],
  summary: "Create a user",
  description: "Create a new administrator, instructor, or student account.",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["first_name", "last_name", "email", "password", "role_id", "contact_no", "gender"],
          properties: {
            first_name: { type: "string", example: "Amit" },
            last_name: { type: "string", example: "Verma" },
            email: { type: "string", format: "email", example: "amit.verma@nsiit.com" },
            password: { type: "string", example: "Student@123" },
            role_id: { type: "integer", enum: [1, 2, 3], example: 3 },
            contact_no: { type: "string", example: "9876501234" },
            gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"], example: "MALE" },
            date_of_birth: { type: "string", format: "date", example: "2001-08-14" },
          },
        },
      },
    },
  },
  responses: {
    201: { description: "User created successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
    400: { description: "Validation error" },
    409: { description: "Email already registered" },
  },
});

addPath("/api/admin/users/{id}", "get", {
  tags: ["Admin Users"],
  summary: "Get single user by ID",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: {
    200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/User" } } } } } },
  },
});

addPath("/api/admin/users/{id}", "put", {
  tags: ["Admin Users"],
  summary: "Update user profile",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string" },
            contact_no: { type: "string" },
            gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"] },
          },
        },
      },
    },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/users/{id}/status", "patch", {
  tags: ["Admin Users"],
  summary: "Update user status",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
          },
        },
      },
    },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/users/students/import", "post", {
  tags: ["Admin Users"],
  summary: "Bulk import students from CSV",
  description: "Accepts parsed student records array and performs atomic transactional batch insertion.",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["students"],
          properties: {
            students: {
              type: "array",
              items: {
                type: "object",
                required: ["first_name", "last_name", "email", "contact_no"],
                properties: {
                  first_name: { type: "string", example: "Aarav" },
                  last_name: { type: "string", example: "Shah" },
                  email: { type: "string", example: "aarav.shah@gmail.com" },
                  contact_no: { type: "string", example: "9876543210" },
                  gender: { type: "string", example: "MALE" },
                },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Bulk import result with created and failed count",
      content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, importedCount: { type: "integer" } } } } },
    },
  },
});

addPath("/api/admin/users/{id}/devices", "get", {
  tags: ["Admin Users"],
  summary: "Get user active devices",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, devices: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/users/{id}/devices/{deviceId}", "delete", {
  tags: ["Admin Users"],
  summary: "Revoke user registered device",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "integer" } },
    { name: "deviceId", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 5. ADMIN PORTAL PROXY VIEWS
// -------------------------------------------------------------
addPath("/api/admin/instructors/{id}/portal", "get", {
  tags: ["Admin Portal Views"],
  summary: "Admin view of Instructor Portal",
  description: "Allows an Administrator to inspect the exact portal layout and statistics for any specific faculty member.",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { description: "Instructor context details" } },
});

addPath("/api/admin/students/{id}/portal", "get", {
  tags: ["Admin Portal Views"],
  summary: "Admin view of Student Portal",
  description: "Allows an Administrator to inspect the student portal view for any specific learner.",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { description: "Student context details" } },
});

// -------------------------------------------------------------
// 6. COURSES
// -------------------------------------------------------------
addPath("/api/courses", "get", {
  tags: ["Courses"],
  summary: "List all courses",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "DRAFT", "INACTIVE"] } },
    { name: "search", in: "query", schema: { type: "string" } },
  ],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: { $ref: "#/components/schemas/Course" } },
            },
          },
        },
      },
    },
  },
});

addPath("/api/courses", "post", {
  tags: ["Courses"],
  summary: "Create new course",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["code", "name"],
          properties: {
            code: { type: "string", example: "FS-NODE" },
            name: { type: "string", example: "Node.js Microservices" },
            description: { type: "string", example: "Backend engineering course" },
            duration: { type: "string", example: "3 Months" },
            status: { type: "string", enum: ["DRAFT", "ACTIVE"] },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/courses/{id}", "get", {
  tags: ["Courses"],
  summary: "Get course details and syllabus",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Course" } } } } } }},
});

addPath("/api/courses/{id}", "put", {
  tags: ["Courses"],
  summary: "Update course details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/courses/{id}/status", "patch", {
  tags: ["Courses"],
  summary: "Update course status",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 7. MODULES
// -------------------------------------------------------------
addPath("/api/courses/{courseId}/modules", "post", {
  tags: ["Modules"],
  summary: "Create module in course",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Express Architecture" },
            description: { type: "string", example: "Routing, middleware, and controllers" },
            display_order: { type: "integer", example: 1 },
            duration: { type: "string", example: "2 Weeks" },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/courses/{courseId}/modules", "get", {
  tags: ["Modules"],
  summary: "Get all modules for a course",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CourseModule" } } } } } } }},
});

addPath("/api/modules/{moduleId}", "get", {
  tags: ["Modules"],
  summary: "Get module details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "moduleId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/CourseModule" } } } } } }},
});

addPath("/api/modules/{moduleId}", "put", {
  tags: ["Modules"],
  summary: "Update module details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "moduleId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/modules/{moduleId}/status", "patch", {
  tags: ["Modules"],
  summary: "Update module status",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "moduleId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ACTIVE", "INACTIVE"] } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/modules/{moduleId}/order", "patch", {
  tags: ["Modules"],
  summary: "Change module display order",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "moduleId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", required: ["display_order"], properties: { display_order: { type: "integer" } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/modules/{moduleId}", "delete", {
  tags: ["Modules"],
  summary: "Delete/Archive module",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "moduleId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 8. LECTURES
// -------------------------------------------------------------
addPath("/api/modules/{moduleId}/lectures", "post", {
  tags: ["Lectures"],
  summary: "Create lecture session in module",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "moduleId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", example: "Event Loop Deep Dive" },
            description: { type: "string", example: "Microtasks and macrotasks" },
            session_type: { type: "string", enum: ["LIVE", "RECORDED"], example: "LIVE" },
            session_url: { type: "string", example: "https://meet.google.com/xyz" },
            duration_minutes: { type: "integer", example: 90 },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/modules/{moduleId}/lectures", "get", {
  tags: ["Lectures"],
  summary: "Get lectures in module",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "moduleId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Lecture" } } } } } } }},
});

addPath("/api/lectures/{lectureId}", "get", {
  tags: ["Lectures"],
  summary: "Get single lecture by ID",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Lecture" } } } } } }},
});

addPath("/api/lectures/{lectureId}", "put", {
  tags: ["Lectures"],
  summary: "Update lecture details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, session_url: { type: "string" } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/lectures/{lectureId}/status", "patch", {
  tags: ["Lectures"],
  summary: "Update lecture status",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["DRAFT", "SCHEDULED", "LIVE", "COMPLETED", "CANCELLED", "PUBLISHED"] } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/lectures/{lectureId}/order", "patch", {
  tags: ["Lectures"],
  summary: "Update lecture order",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", required: ["display_order"], properties: { display_order: { type: "integer" } } } } },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/lectures/{lectureId}", "delete", {
  tags: ["Lectures"],
  summary: "Delete lecture",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 9. LECTURE NOTES
// -------------------------------------------------------------
addPath("/api/lectures/{lectureId}/notes", "post", {
  tags: ["Lecture Notes"],
  summary: "Attach note/resource to lecture",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["title", "note_type"],
          properties: {
            title: { type: "string", example: "Lecture Slides PDF" },
            note_type: { type: "string", enum: ["PDF", "PPT", "DOC", "EXCEL", "ZIP", "CODE", "LINK", "OTHER"], example: "PDF" },
            file_url: { type: "string", example: "https://example.com/slides.pdf" },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/lectures/{lectureId}/notes", "get", {
  tags: ["Lecture Notes"],
  summary: "Get notes for a lecture",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/LectureNote" } } } } } } }},
});

addPath("/api/notes/{noteId}", "put", {
  tags: ["Lecture Notes"],
  summary: "Update note",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "noteId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, file_url: { type: "string" } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/notes/{noteId}/status", "patch", {
  tags: ["Lecture Notes"],
  summary: "Update note status",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "noteId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ACTIVE", "INACTIVE"] } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/notes/{noteId}", "delete", {
  tags: ["Lecture Notes"],
  summary: "Delete note",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "noteId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 10. BATCHES & ALLOCATIONS
// -------------------------------------------------------------
addPath("/api/admin/courses/{courseId}/batches", "post", {
  tags: ["Batches"],
  summary: "Create cohort batch for course",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["name", "start_date"],
          properties: {
            name: { type: "string", example: "Summer Cohort" },
            start_date: { type: "string", format: "date", example: "2026-06-01" },
            end_date: { type: "string", format: "date", example: "2026-12-01" },
            batch_mode: { type: "string", enum: ["ONLINE", "OFFLINE", "HYBRID"], example: "ONLINE" },
            batch_time: { type: "string", enum: ["MORNING", "EVENING"], example: "MORNING" },
            batch_schedule: { type: "string", enum: ["WEEKDAYS", "WEEKENDS"], example: "WEEKDAYS" },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/courses/{courseId}/batches", "get", {
  tags: ["Batches"],
  summary: "Get batches for a course",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CourseBatch" } } } } } } }},
});

addPath("/api/admin/batches/{id}", "get", {
  tags: ["Batches"],
  summary: "Get single batch details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/CourseBatch" } } } } } }},
});

addPath("/api/admin/batches/{id}", "put", {
  tags: ["Batches"],
  summary: "Update batch details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, batch_mode: { type: "string" } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/batches/{id}/status", "patch", {
  tags: ["Batches"],
  summary: "Update batch status",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/batches/{batchId}/instructors", "post", {
  tags: ["Batch Instructors"],
  summary: "Assign faculty to batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["instructor_id"], properties: { instructor_id: { type: "integer", example: 2 } } } } } },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/batches/{batchId}/instructors", "get", {
  tags: ["Batch Instructors"],
  summary: "Get assigned instructors for batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/batches/{batchId}/instructors/{instructorId}/status", "patch", {
  tags: ["Batch Instructors"],
  summary: "Update instructor assignment status",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "batchId", in: "path", required: true, schema: { type: "integer" } },
    { name: "instructorId", in: "path", required: true, schema: { type: "integer" } },
  ],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ACTIVE", "INACTIVE"] } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/batches/{batchId}/instructors/{instructorId}", "delete", {
  tags: ["Batch Instructors"],
  summary: "Remove instructor from batch",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "batchId", in: "path", required: true, schema: { type: "integer" } },
    { name: "instructorId", in: "path", required: true, schema: { type: "integer" } },
  ],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/batches/{batchId}/students", "post", {
  tags: ["Batch Students"],
  summary: "Enroll student into batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["student_id"],
          properties: {
            student_id: { type: "integer", example: 3 },
            enrollment_date: { type: "string", format: "date", example: "2026-02-01" },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/batches/{batchId}/students", "get", {
  tags: ["Batch Students"],
  summary: "Get enrolled students for batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/batches/{batchId}/students/{studentId}/status", "patch", {
  tags: ["Batch Students"],
  summary: "Update student enrollment status",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "batchId", in: "path", required: true, schema: { type: "integer" } },
    { name: "studentId", in: "path", required: true, schema: { type: "integer" } },
  ],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ACTIVE", "INACTIVE", "COMPLETED", "DROPPED"] } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/batches/{batchId}/students/{studentId}", "delete", {
  tags: ["Batch Students"],
  summary: "Remove student from batch",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "batchId", in: "path", required: true, schema: { type: "integer" } },
    { name: "studentId", in: "path", required: true, schema: { type: "integer" } },
  ],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 11. INSTRUCTOR PORTAL
// -------------------------------------------------------------
addPath("/api/instructor/my-batches", "get", {
  tags: ["Instructor Portal"],
  summary: "Get assigned batches for logged-in instructor",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CourseBatch" } } } } } } }},
});

addPath("/api/instructor/batches/{batchId}/students", "get", {
  tags: ["Instructor Portal"],
  summary: "Get student roster for batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/instructor/batches/{batchId}/content", "get", {
  tags: ["Instructor Portal"],
  summary: "Get course curriculum and syllabus for assigned batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object" } } } } } }},
});

addPath("/api/instructor/batches/{batchId}/sessions", "post", {
  tags: ["Instructor Portal"],
  summary: "Schedule live lecture session for batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["module_id", "title", "session_url", "scheduled_at"],
          properties: {
            module_id: { type: "integer", example: 1 },
            title: { type: "string", example: "Live Q&A on React" },
            session_url: { type: "string", example: "https://meet.google.com/xyz" },
            scheduled_at: { type: "string", format: "date-time" },
            duration_minutes: { type: "integer", example: 60 },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/instructor/courses/{courseId}/reviews", "get", {
  tags: ["Instructor Portal"],
  summary: "Get student reviews for course taught by instructor",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CourseReview" } } } } } } }},
});

// -------------------------------------------------------------
// 12. STUDENT PORTAL & PROGRESS
// -------------------------------------------------------------
addPath("/api/student/my-batches", "get", {
  tags: ["Student Portal"],
  summary: "Get enrolled batches for student",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CourseBatch" } } } } } } }},
});

addPath("/api/student/batches/{batchId}/content", "get", {
  tags: ["Student Portal"],
  summary: "Get learning player curriculum (modules, lectures, notes, and progress) for batch",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "batchId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object" } } } } } }},
});

addPath("/api/student/upcoming-sessions", "get", {
  tags: ["Student Portal"],
  summary: "Get upcoming live lecture sessions across enrolled batches",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Lecture" } } } } } } }},
});

addPath("/api/student/sessions/{sessionId}/access", "post", {
  tags: ["Student Portal"],
  summary: "Record session access/viewing",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/student/sessions/{sessionId}/complete", "post", {
  tags: ["Student Portal"],
  summary: "Toggle/Mark lecture session as completed",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/student/sessions/{sessionId}/progress", "get", {
  tags: ["Student Portal"],
  summary: "Get progress status for a lecture session",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, completed: { type: "boolean" } } } } } }},
});

addPath("/api/student/courses/{courseId}/progress", "get", {
  tags: ["Student Portal"],
  summary: "Get overall completion percentage for a course",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, completion_percentage: { type: "number" } } } } } }},
});

addPath("/api/student/progress", "get", {
  tags: ["Student Portal"],
  summary: "Get progress across all enrolled courses",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

// -------------------------------------------------------------
// 13. QUIZZES (ADMIN & INSTRUCTOR)
// -------------------------------------------------------------
addPath("/api/quizzes/languages", "get", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Get supported Judge0 programming languages",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, languages: { type: "array", items: { type: "string" } } } } } } }},
});

addPath("/api/quizzes/sample-csv", "get", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Download sample CSV template for quiz authoring",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "text/csv": { schema: { type: "string", example: "question_text,question_type,marks,difficulty,option_a,option_b,correct_option..." } } } } },
});

addPath("/api/quizzes/import-csv", "post", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Create new test / assessment by uploading or parsing CSV",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["title", "course_id", "module_id"],
          properties: {
            title: { type: "string", example: "Python Fundamentals & OOP Assessment" },
            description: { type: "string", example: "Assessment imported via CSV" },
            course_id: { type: "integer", example: 1 },
            module_id: { type: "integer", example: 1 },
            duration_minutes: { type: "integer", example: 30 },
            passing_marks: { type: "number", example: 15 },
            max_attempts: { type: "integer", example: 2 },
            csv_content: { type: "string", description: "Raw CSV text with question rows" },
            questions: { type: "array", items: { type: "object" }, description: "Pre-parsed question objects" },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/Quiz" } } } } } } },
});

addPath("/api/quizzes/{quizId}/import-csv", "post", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Bulk import questions from CSV into an existing quiz",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            csv_content: { type: "string", description: "Raw CSV text" },
            questions: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
  },
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" }, data: { $ref: "#/components/schemas/Quiz" } } } } } } },
});

addPath("/api/quizzes", "get", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "List all quizzes",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "course_id", in: "query", schema: { type: "integer" } },
    { name: "module_id", in: "query", schema: { type: "integer" } },
  ],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, quizzes: { type: "array", items: { $ref: "#/components/schemas/Quiz" } } } } } } }},
});

addPath("/api/quizzes", "post", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Create new quiz",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", example: "JavaScript Promises Quiz" },
            description: { type: "string", example: "Async/await and microtasks" },
            course_id: { type: "integer", example: 1 },
            module_id: { type: "integer", example: 1 },
            duration_minutes: { type: "integer", example: 30 },
            total_marks: { type: "number", example: 20 },
            passing_marks: { type: "number", example: 10 },
            max_attempts: { type: "integer", example: 2 },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/quizzes/{quizId}", "get", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Get quiz with full questions and test cases",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, quiz: { $ref: "#/components/schemas/Quiz" } } } } } }},
});

addPath("/api/quizzes/{quizId}", "put", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Update quiz settings",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, duration_minutes: { type: "integer" } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/quizzes/{quizId}", "delete", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Delete quiz",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/quizzes/{quizId}/publish", "patch", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Publish quiz to students",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/quizzes/{quizId}/close", "patch", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Close quiz for submissions",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/quizzes/{quizId}/questions", "post", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Add question to quiz (MCQ or CODING)",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["question_type", "question_text"],
          properties: {
            question_type: { type: "string", enum: ["MCQ", "CODING"], example: "MCQ" },
            question_text: { type: "string", example: "Which method schedules a macro-task?" },
            marks: { type: "number", example: 5 },
            difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"], example: "EASY" },
            programming_language: { type: "string", example: "javascript" },
            starter_code: { type: "string", example: "function solution() {\n\n}" },
            expected_output: { type: "string", example: "Hello World" },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/questions/{questionId}", "put", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Update question details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "questionId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { question_text: { type: "string" }, marks: { type: "number" } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/questions/{questionId}", "delete", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Delete question",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "questionId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/questions/{questionId}/options", "post", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Add option choice to MCQ question",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "questionId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["option_label", "option_text", "is_correct"],
          properties: {
            option_label: { type: "string", example: "A" },
            option_text: { type: "string", example: "setTimeout" },
            is_correct: { type: "boolean", example: true },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/options/{optionId}", "put", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Update option choice",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "optionId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { option_text: { type: "string" }, is_correct: { type: "boolean" } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/options/{optionId}", "delete", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Delete option choice",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "optionId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/quizzes/{quizId}/attempts", "get", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Get student submissions and attempts for a quiz",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, attempts: { type: "array", items: { $ref: "#/components/schemas/QuizAttempt" } } } } } } }},
});

addPath("/api/quizzes/attempts/{attemptId}", "get", {
  tags: ["Quizzes (Admin & Instructor)"],
  summary: "Get detailed attempt report with student answers and score breakdown",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "attemptId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, attempt: { $ref: "#/components/schemas/QuizAttempt" } } } } } }},
});

// -------------------------------------------------------------
// 14. STUDENT QUIZZES & ASSESSMENT
// -------------------------------------------------------------
addPath("/api/student/quizzes", "get", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Get available quizzes for logged-in student",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, quizzes: { type: "array", items: { $ref: "#/components/schemas/Quiz" } } } } } } }},
});

addPath("/api/student/quizzes/{quizId}", "get", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Get quiz instructions and details before starting",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, quiz: { $ref: "#/components/schemas/Quiz" } } } } } }},
});

addPath("/api/student/quizzes/{quizId}/start", "post", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Start or resume timed quiz attempt",
  description: "Creates an attempt or returns current in-progress attempt. Correct answers are sanitized and hidden.",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, attempt: { $ref: "#/components/schemas/QuizAttempt" }, questions: { type: "array", items: { $ref: "#/components/schemas/QuizQuestion" } } } } } } }},
});

addPath("/api/student/quizzes/{quizId}/attempts/current", "get", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Get current in-progress attempt state",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, attempt: { $ref: "#/components/schemas/QuizAttempt" } } } } } }},
});

addPath("/api/student/attempts/{attemptId}/answers", "post", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Save or auto-save answer for a question during active test",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "attemptId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["question_id"],
          properties: {
            question_id: { type: "integer", example: 1 },
            selected_option_id: { type: "integer", nullable: true, example: 4 },
            code_submission: { type: "string", nullable: true, example: "function add(a, b) { return a + b; }" },
          },
        },
      },
    },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/student/attempts/{attemptId}/run-code", "post", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Execute code via Judge0 compiler against test cases during test",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "attemptId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["question_id", "source_code", "language"],
          properties: {
            question_id: { type: "integer", example: 2 },
            source_code: { type: "string", example: "print('Hello from student')" },
            language: { type: "string", example: "python" },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Judge0 execution output",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              output: { type: "string", example: "Hello from student\n" },
              status: { type: "string", example: "Accepted" },
              time: { type: "string", example: "0.02" },
              memory: { type: "number", example: 1200 },
            },
          },
        },
      },
    },
  },
});

addPath("/api/student/attempts/{attemptId}/submit", "post", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Submit test for grading and instant evaluation",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "attemptId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, score: { type: "number", example: 45 }, passed: { type: "boolean", example: true } } } } } }},
});

addPath("/api/student/attempts/{attemptId}/result", "get", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Get scorecard and evaluation details for a submitted attempt",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "attemptId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, result: { type: "object" } } } } } }},
});

addPath("/api/student/quizzes/{quizId}/attempts", "get", {
  tags: ["Student Quizzes & Assessment"],
  summary: "Get student's attempt history for a quiz",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "quizId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, attempts: { type: "array", items: { $ref: "#/components/schemas/QuizAttempt" } } } } } } }},
});

// -------------------------------------------------------------
// 15. COURSE REVIEWS
// -------------------------------------------------------------
addPath("/api/courses/{courseId}/reviews/summary", "get", {
  tags: ["Course Reviews"],
  summary: "Get average rating and review count for course",
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, averageRating: { type: "number", example: 4.8 }, totalReviews: { type: "integer", example: 25 } } } } } }},
});

addPath("/api/courses/{courseId}/reviews", "get", {
  tags: ["Course Reviews"],
  summary: "Get approved active reviews for a course",
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CourseReview" } } } } } } }},
});

addPath("/api/student/courses/{courseId}/reviews", "post", {
  tags: ["Course Reviews"],
  summary: "Submit review and rating for course",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["rating"],
          properties: {
            rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
            review: { type: "string", example: "Clear explanations and great hands-on coding labs." },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/student/courses/{courseId}/reviews/me", "get", {
  tags: ["Course Reviews"],
  summary: "Get logged-in student's review for course",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/CourseReview" } } } } } }},
});

addPath("/api/student/courses/{courseId}/reviews/me", "put", {
  tags: ["Course Reviews"],
  summary: "Update logged-in student's review",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { rating: { type: "integer" }, review: { type: "string" } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/student/courses/{courseId}/reviews/me", "delete", {
  tags: ["Course Reviews"],
  summary: "Delete logged-in student's review",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/courses/{courseId}/reviews", "get", {
  tags: ["Course Reviews"],
  summary: "Admin list all reviews for moderation (including hidden)",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CourseReview" } } } } } } }},
});

addPath("/api/admin/reviews/{reviewId}/hide", "patch", {
  tags: ["Course Reviews"],
  summary: "Hide/Moderate inappropriate review",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "reviewId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/reviews/{reviewId}/restore", "patch", {
  tags: ["Course Reviews"],
  summary: "Restore hidden review to active",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "reviewId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 16. ANNOUNCEMENTS
// -------------------------------------------------------------
addPath("/api/admin/announcements", "post", {
  tags: ["Announcements"],
  summary: "Create announcement",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["title", "message"],
          properties: {
            title: { type: "string", example: "Upcoming Hackathon" },
            message: { type: "string", example: "Annual LMS coding hackathon starting next Friday." },
            course_id: { type: "integer", nullable: true, example: null },
            batch_id: { type: "integer", nullable: true, example: null },
            status: { type: "string", enum: ["DRAFT", "PUBLISHED"], example: "PUBLISHED" },
          },
        },
      },
    },
  },
  responses: { 201: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/announcements", "get", {
  tags: ["Announcements"],
  summary: "List announcements for admin",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] } },
    { name: "search", in: "query", schema: { type: "string" } },
  ],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Announcement" } } } } } } }},
});

addPath("/api/admin/announcements/{id}", "get", {
  tags: ["Announcements"],
  summary: "Get announcement details",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Announcement" } } } } } }},
});

addPath("/api/admin/announcements/{id}", "put", {
  tags: ["Announcements"],
  summary: "Update announcement",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, message: { type: "string" } } } } } },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/announcements/{id}/publish", "patch", {
  tags: ["Announcements"],
  summary: "Publish announcement and notify students",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/announcements/{id}/archive", "patch", {
  tags: ["Announcements"],
  summary: "Archive announcement",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/admin/announcements/{id}", "delete", {
  tags: ["Announcements"],
  summary: "Delete announcement",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/student/announcements", "get", {
  tags: ["Announcements"],
  summary: "Get announcements targeted to student",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Announcement" } } } } } } }},
});

// -------------------------------------------------------------
// 17. NOTIFICATIONS
// -------------------------------------------------------------
addPath("/api/notifications", "get", {
  tags: ["Notifications"],
  summary: "Get user in-app notifications",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "unreadOnly", in: "query", schema: { type: "boolean" } },
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
  ],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Notification" } } } } } } }},
});

addPath("/api/notifications/unread-count", "get", {
  tags: ["Notifications"],
  summary: "Get unread notifications count",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { unread_count: { type: "integer", example: 3 } } } } } } } }},
});

addPath("/api/notifications/{id}/read", "patch", {
  tags: ["Notifications"],
  summary: "Mark notification as read",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

addPath("/api/notifications/read-all", "patch", {
  tags: ["Notifications"],
  summary: "Mark all notifications as read",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 18. REPORTS & ANALYTICS
// -------------------------------------------------------------
addPath("/api/admin/reports/overview", "get", {
  tags: ["Reports & Analytics"],
  summary: "Get overview KPI stats (total students, active batches, pass rate)",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object" } } } } } }},
});

addPath("/api/admin/reports/student-progress", "get", {
  tags: ["Reports & Analytics"],
  summary: "Get student syllabus progression metrics across batches",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/reports/quizzes", "get", {
  tags: ["Reports & Analytics"],
  summary: "Get quiz assessment analytics and passing rates",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/reports/batches", "get", {
  tags: ["Reports & Analytics"],
  summary: "Get batch performance and completion distribution",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/reports/feedback", "get", {
  tags: ["Reports & Analytics"],
  summary: "Get course rating satisfaction metrics",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/reports/devices", "get", {
  tags: ["Reports & Analytics"],
  summary: "Get student device security audit logs",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } }},
});

addPath("/api/admin/reports/students/{studentId}/dossier", "get", {
  tags: ["Reports & Analytics"],
  summary: "Get 360-degree comprehensive student dossier report",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "studentId", in: "path", required: true, schema: { type: "integer" } }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object" } } } } } }},
});

// -------------------------------------------------------------
// 19. PLATFORM SETTINGS
// -------------------------------------------------------------
addPath("/api/admin/settings", "get", {
  tags: ["Platform Settings"],
  summary: "Get all platform settings and parameters",
  security: [{ bearerAuth: [] }],
  responses: { 200: { content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object" } } } } } }},
});

addPath("/api/admin/settings", "put", {
  tags: ["Platform Settings"],
  summary: "Update platform settings",
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["settings"],
          properties: {
            settings: {
              type: "object",
              example: {
                platform_title: "NSI IT LMS",
                contact_email: "support@nsiit.com",
                default_passing_marks: "40.00",
                max_quiz_attempts: "3",
              },
            },
          },
        },
      },
    },
  },
  responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } } },
});

// -------------------------------------------------------------
// 20. RBAC TEST
// -------------------------------------------------------------
addPath("/api/test/admin", "get", {
  tags: ["RBAC Test"],
  summary: "Test ADMIN authorization",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Authorized Admin" } },
});

addPath("/api/test/instructor", "get", {
  tags: ["RBAC Test"],
  summary: "Test INSTRUCTOR authorization",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Authorized Instructor" } },
});

addPath("/api/test/student", "get", {
  tags: ["RBAC Test"],
  summary: "Test STUDENT authorization",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Authorized Student" } },
});

// Write outputs
const openapiDir = path.resolve(__dirname, "../../../openapi");
if (!fs.existsSync(openapiDir)) {
  fs.mkdirSync(openapiDir, { recursive: true });
}

const yamlString = YAML.stringify(doc, 10, 2);
fs.writeFileSync(path.join(openapiDir, "openapi.yaml"), yamlString, "utf-8");
fs.writeFileSync(path.join(openapiDir, "openapi.json"), JSON.stringify(doc, null, 2), "utf-8");

const pathCount = Object.keys(doc.paths).length;
let opCount = 0;
for (const p in doc.paths) {
  opCount += Object.keys(doc.paths[p]).length;
}

console.log(`OpenAPI successfully generated! Distinct paths: ${pathCount}, Operations: ${opCount}, Schemas: ${Object.keys(doc.components.schemas).length}`);
