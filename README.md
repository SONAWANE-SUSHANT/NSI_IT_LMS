# NSI IT LMS — Enterprise Learning Management System

> **Nityashree Infosystems (NSI IT)** Learning Management System is a full-stack, enterprise-grade educational platform built for modern tech academies, universities, and training institutes. It provides distinct, role-based portals for **Students**, **Instructors**, and **Administrators**, featuring live lecture scheduling, curriculum authoring, cohort batch allocations, interactive quizzes with in-browser automated code compilation (via Judge0), reviews and star ratings, in-app notification broadcasting, platform configuration, and administrative analytical reporting.

---

## 🚀 Key Features

* **🔐 Authentication & RBAC (Role-Based Access Control):**
  * Three user roles: `ADMIN` (1), `INSTRUCTOR` (2), and `STUDENT` (3).
  * JWT Bearer authentication with token blacklist and real-time active status verification.
  * Device tracking, concurrent login limit enforcement, and device revocation for student accounts.
  * Administrative proxy viewing: Admins can inspect the exact portal layout and statistics for any faculty member or student.
* **🎓 Student Portal:**
  * Enrolled course dashboard with visual progress tracking.
  * Interactive curriculum player (video lectures, resource notes, slides).
  * Real-time lecture timetable calendar with direct Google Meet / Zoom meeting links.
  * Assessment engine: timed tests, MCQ questions, and live code execution with sample test cases.
  * Course reviews and star rating submission.
* **👨‍🏫 Instructor Faculty Portal:**
  * Assigned cohort batch overview with learner rosters.
  * Live session scheduling with automated calendar timetable integration.
  * Assessment management: build quizzes, define MCQ options, and set coding challenges.
  * Evaluation & grading: inspect student submissions, test outputs, and override grades.
  * Instructor-targeted announcements and course review inspections.
* **⚡ Admin Operations & Management:**
  * User directory with role filters, status toggling, and bulk CSV learner import.
  * Course catalog and syllabus builder (Courses → Modules → Lectures → Notes).
  * Cohort batch creation, instructor assignments, and student enrollments.
  * Assessment management suite with Judge0 language support.
  * Broadcast notification center: create announcements targeted by academy, course, or batch.
  * Reports & Analytics Hub: 6 downloadable reports (Enrollments, Quizzes, Attendance, Batches, Instructors, and 360° individual student dossiers) with CSV export.
  * Platform settings management (branding title, support contacts, default passing threshold, session timeouts).
* **📚 Interactive API Documentation:**
  * Live OpenAPI 3.0.3 Swagger UI mounted at `http://localhost:5000/api-docs`.
  * Complete 123-request Postman Collection with automated JWT extraction and test assertions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19.2, Vite 8.2, Tailwind CSS v4, React Router v7, Lucide React icons |
| **Backend** | Node.js (v20+), Express 5.2 (Next-Gen), Sequelize 6.37 ORM |
| **Database** | MySQL 8.0+ (`mysql2` driver, UTF8MB4 charset, strict foreign keys) |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` (cost factor 10), in-memory status caching |
| **Code Execution** | Judge0 Compilation Engine API (Python 3, JavaScript, Java, C++, C, Bash) |
| **API Docs & Testing**| OpenAPI 3.0.3, Swagger UI (`swagger-ui-express`), Postman Collection v2.1.0 |

---

## 📂 Project Architecture

```
NSI-IT-LMS/
├── client/                     # Vite + React 19 Frontend SPA
│   ├── src/
│   │   ├── components/         # Layouts (Admin, Instructor, Student), modals, navbars
│   │   ├── context/            # AuthContext, StudentPortalContext, InstructorPortalContext
│   │   ├── pages/
│   │   │   ├── admin/          # Admin management (Users, Courses, Batches, Reports, Settings)
│   │   │   ├── instructor/     # Faculty teaching space (Batches, Quizzes, Grading, Schedule)
│   │   │   ├── student/        # Student learning player, quizzes, calendar, grades
│   │   │   └── shared/         # Common profile, calendar, unauthorized views
│   │   └── services/           # Axios/Fetch API client layer
├── server/                     # Express 5.x REST API
│   ├── src/
│   │   ├── config/             # database.js, app.js, environment loaders
│   │   ├── controllers/        # Request handlers & response formatting
│   │   ├── middleware/         # auth.middleware, role.middleware, error handler
│   │   ├── models/             # 22 Sequelize ORM models & relational associations
│   │   ├── routes/             # REST endpoint route files
│   │   ├── scripts/            # Migration runners, test suites, and generators
│   │   └── services/           # Business logic & Judge0 compilation client
├── database/
│   └── migrations/             # 23 raw SQL migration files (001 to 023)
├── openapi/                    # OpenAPI 3.0.3 specification (YAML & JSON)
│   ├── openapi.yaml
│   └── openapi.json
└── postman/                    # Ready-to-import Postman Collection
    └── NSI-IT-LMS.postman_collection.json
```

For a comprehensive deep-dive into the architectural design, security patterns, data flows, and state management, see [ARCHITECTURE.md](file:///c:/Users/91876/Desktop/Nitashree_lms/NSI-IT-LMS/ARCHITECTURE.md).

For a complete breakdown of all 22 database tables, column schemas, foreign key relationships, and indexes, see [DATABASE.md](file:///c:/Users/91876/Desktop/Nitashree_lms/NSI-IT-LMS/DATABASE.md).

---

## ⚡ Getting Started & Local Setup

### 1. Prerequisites
* **Node.js:** v20.x or higher
* **npm:** v10.x or higher
* **MySQL:** Server 8.0 or higher running locally or in Docker

---

### 2. Database Configuration
1. Start your MySQL service.
2. Create the database:
   ```sql
   CREATE DATABASE nsi_it_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   ```
3. Configure environment variables in `server/.env`:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=nsi_it_lms
   DB_USER=root
   DB_PASSWORD=YourMySQLPassword
   
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=1d
   
   # Optional Judge0 RapidAPI / Self-hosted keys for programming quizzes
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your_rapidapi_key
   ```

---

### 3. Run Migrations & Default Seed Data
Execute the migration runner to build all tables and insert the default administrative and faculty accounts:
```bash
cd server
node src/scripts/run_migrations.js
```

#### Default Credentials Seeded:
| Role | Email | Password | Username |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@nsiit.com` | `Admin@123` | `admin.administrator@nsi` |
| **Instructor** | `instructor@nsiit.com` | `Instructor@123` | `instructor.faculty@nsi` |
| **Student** | `student@nsiit.com` | `Student@123` | `student.learner@nsi` |

---

### 4. Running the Development Servers

#### Start the Backend API Server (Port 5000):
```bash
cd server
npm install
npm run dev
```

#### Start the Frontend Client SPA (Port 5173):
```bash
cd client
npm install
npm run dev
```
Open your browser at **`http://localhost:5173`** to access the LMS.

---

## 📖 Interactive API Documentation & Postman

### Live Swagger UI
Visit **`http://localhost:5000/api-docs`** in your browser while the server is running to explore, test, and execute all 123 API endpoints interactively.

### Postman Collection
A pre-configured collection is provided at [`postman/NSI-IT-LMS.postman_collection.json`](file:///c:/Users/91876/Desktop/Nitashree_lms/NSI-IT-LMS/postman/NSI-IT-LMS.postman_collection.json):
1. Open **Postman** and click **Import**.
2. Select `postman/NSI-IT-LMS.postman_collection.json`.
3. Execute the `Authentication -> User Login` request with `admin@nsiit.com`.
4. The test script will **automatically extract and store** the JWT Bearer token into the `{{token}}` variable.
5. All subsequent requests automatically inherit this token.

---

## 🧪 Testing & Verification Scripts

The server contains verification scripts in `server/src/scripts/`:
* `test_users_api.js` — Verifies user management, duplicate prevention, and role assignment.
* `test_quiz_flow.js` — Verifies quiz authoring and submission grading.
* `test_device_management.js` — Verifies student device limit enforcement.
* `test_report_suite.js` — Verifies analytical aggregations and dossier generation.
* `test_announcement_notification_suite.js` — Tests notice broadcasts and read receipts.

Run any test script using:
```bash
cd server
node src/scripts/test_quiz_flow.js
```

---

## 🛡️ License

Copyright © 2026 Nityashree Infosystems (NSI IT). All rights reserved.
