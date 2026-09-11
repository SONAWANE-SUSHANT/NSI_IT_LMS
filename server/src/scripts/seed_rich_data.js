const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const {
  Course,
  CourseBatch,
  CourseInstructor,
  CourseStudent,
  CourseModule,
  Lecture,
  LectureNote,
  User,
  UserRole,
} = require("../models");

async function seedRichData() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Roles
    const adminRole = await UserRole.findOne({ where: { name: "ADMIN" } });
    const instructorRole = await UserRole.findOne({ where: { name: "INSTRUCTOR" } });
    const studentRole = await UserRole.findOne({ where: { name: "STUDENT" } });

    if (!adminRole || !instructorRole || !studentRole) {
      throw new Error("Roles not found. Ensure run_migrations.js has been executed.");
    }

    // Admin user
    let admin = await User.findOne({ where: { role_id: adminRole.id } });
    if (!admin) {
      const passwordHash = await bcrypt.hash("Admin@123", 10);
      admin = await User.create({
        first_name: "Admin",
        last_name: "System",
        email: "admin@nsiit.com",
        password: passwordHash,
        role_id: adminRole.id,
        contact_no: "9888888888",
        gender: "MALE",
        status: "ACTIVE",
      });
    }

    const defaultPassword = await bcrypt.hash("Password@123", 10);
    const studentPassword = await bcrypt.hash("Student@123", 10);
    const instructorPassword = await bcrypt.hash("Instructor@123", 10);

    // =========================================================================
    // 1. SEED 4 INSTRUCTORS
    // =========================================================================
    console.log("--- Seeding 4 Instructors ---");
    const instructorDefs = [
      {
        first_name: "Instructor",
        last_name: "Faculty",
        email: "instructor@nsiit.com",
        contact_no: "9111111111",
        gender: "MALE",
      },
      {
        first_name: "Aditi",
        last_name: "Sharma",
        email: "aditi.sharma@nsiit.com",
        contact_no: "9111111112",
        gender: "FEMALE",
      },
      {
        first_name: "Rohit",
        last_name: "Verma",
        email: "rohit.verma@nsiit.com",
        contact_no: "9111111113",
        gender: "MALE",
      },
      {
        first_name: "Priya",
        last_name: "Nair",
        email: "priya.nair@nsiit.com",
        contact_no: "9111111114",
        gender: "FEMALE",
      },
    ];

    const instructors = [];
    for (const def of instructorDefs) {
      let inst = await User.findOne({ where: { email: def.email } });
      if (!inst) {
        inst = await User.create({
          ...def,
          password: instructorPassword,
          role_id: instructorRole.id,
          status: "ACTIVE",
          created_by: admin.id,
          updated_by: admin.id,
        });
        await inst.reload();
        console.log(`Created Instructor: ${inst.first_name} ${inst.last_name} (@${inst.username})`);
      }
      instructors.push(inst);
    }

    // =========================================================================
    // 2. SEED 25 STUDENTS
    // =========================================================================
    console.log("--- Seeding 25 Students ---");
    const studentNames = [
      ["Student", "Learner", "student@nsiit.com", "FEMALE"],
      ["Aarav", "Patel", "aarav.patel@nsiit.com", "MALE"],
      ["Ananya", "Deshmukh", "ananya.d@nsiit.com", "FEMALE"],
      ["Dev", "Kulkarni", "dev.kulkarni@nsiit.com", "MALE"],
      ["Ishita", "Sen", "ishita.sen@nsiit.com", "FEMALE"],
      ["Kabir", "Mehta", "kabir.mehta@nsiit.com", "MALE"],
      ["Khushi", "Joshi", "khushi.joshi@nsiit.com", "FEMALE"],
      ["Manish", "Gupta", "manish.gupta@nsiit.com", "MALE"],
      ["Neha", "Rao", "neha.rao@nsiit.com", "FEMALE"],
      ["Omkar", "Shinde", "omkar.shinde@nsiit.com", "MALE"],
      ["Pooja", "Reddy", "pooja.reddy@nsiit.com", "FEMALE"],
      ["Pranav", "Bose", "pranav.bose@nsiit.com", "MALE"],
      ["Rhea", "Kapoor", "rhea.kapoor@nsiit.com", "FEMALE"],
      ["Rohan", "Chopra", "rohan.chopra@nsiit.com", "MALE"],
      ["Sanya", "Malhotra", "sanya.m@nsiit.com", "FEMALE"],
      ["Siddharth", "Roy", "siddharth.roy@nsiit.com", "MALE"],
      ["Sneha", "Kadam", "sneha.kadam@nsiit.com", "FEMALE"],
      ["Tanmay", "Bhatia", "tanmay.b@nsiit.com", "MALE"],
      ["Urvi", "Shah", "urvi.shah@nsiit.com", "FEMALE"],
      ["Varun", "Pawar", "varun.pawar@nsiit.com", "MALE"],
      ["Vidya", "Iyer", "vidya.iyer@nsiit.com", "FEMALE"],
      ["Yash", "Thakur", "yash.thakur@nsiit.com", "MALE"],
      ["Zoya", "Khan", "zoya.khan@nsiit.com", "FEMALE"],
      ["Aditya", "Mishra", "aditya.mishra@nsiit.com", "MALE"],
      ["Bhavna", "Trivedi", "bhavna.t@nsiit.com", "FEMALE"],
    ];

    const students = [];
    for (let i = 0; i < studentNames.length; i++) {
      const [first, last, email, gender] = studentNames[i];
      let stu = await User.findOne({ where: { email } });
      if (!stu) {
        stu = await User.create({
          first_name: first,
          last_name: last,
          email: email,
          password: studentPassword,
          role_id: studentRole.id,
          contact_no: `97000000${(i + 1).toString().padStart(2, "0")}`,
          gender: gender,
          status: "ACTIVE",
          created_by: admin.id,
          updated_by: admin.id,
        });
        await stu.reload();
        console.log(`Created Student ${i + 1}: ${stu.first_name} ${stu.last_name} (@${stu.username})`);
      }
      students.push(stu);
    }

    // =========================================================================
    // 3. SEED 5 COURSES & BATCHES
    // =========================================================================
    console.log("--- Seeding 5 Courses with Batches ---");
    const courseDefs = [
      {
        code: "FSWD-01",
        name: "Full Stack Web Development Masterclass",
        description: "Master React 19, Tailwind CSS, Node.js, Express, Sequelize, and MySQL architecture.",
        duration: "6 Months",
        batch: {
          name: "FSWD-2026-Cohort-A",
          description: "Morning intensive live bootcamp with real-world enterprise projects.",
          start_date: "2026-09-01",
          end_date: "2027-02-28",
          batch_mode: "ONLINE",
          batch_time: "MORNING",
          batch_schedule: "WEEKDAYS",
        },
        instructorIdx: 0, // Instructor Faculty
        modules: [
          {
            name: "Module 1: React 19 & Modern UI Architecture",
            description: "Component composition, Tailwind CSS v4, custom hooks, and state management.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Deep Dive into Modular Component Design & Tailwind CSS",
                description: "Composing reusable atomic UI components with clean separation of concerns.",
                session_type: "LIVE",
                dayOffset: 1, // Sept 9
                hour: 10,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-demo",
              },
              {
                title: "Advanced React State Management & Custom Hooks",
                description: "Practical state machines, reducer patterns, and context architectures.",
                session_type: "LIVE",
                dayOffset: 3, // Sept 11
                hour: 10,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-hooks",
              },
              {
                title: "Client-Side Routing & Nested Layout Systems",
                description: "Deep dive into React Router 7 layouts, route loaders, and error boundaries.",
                session_type: "RECORDED",
                dayOffset: 5, // Sept 13
                hour: 14,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-react-routing",
              },
              {
                title: "Component Performance Optimization & Profiling",
                description: "React DevTools profiler, memoization, and avoiding re-renders.",
                session_type: "LIVE",
                dayOffset: 8, // Sept 16
                hour: 10,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-perf",
              },
            ],
          },
          {
            name: "Module 2: Node.js, Express & Scalable REST APIs",
            description: "Express 5 routing, middleware pipelines, authentication, and error handlers.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Express 5 Architecture & Async Error Pipelines",
                description: "Production-grade RESTful API patterns and centralized error logging.",
                session_type: "LIVE",
                dayOffset: 10,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-express",
              },
              {
                title: "JWT Authentication, Refresh Tokens & Role Access Control",
                description: "Securing routes, cryptographic verification, and token rotation.",
                session_type: "LIVE",
                dayOffset: 12,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-jwt",
              },
              {
                title: "API Input Validation & Sanitization with Express Validator",
                description: "Preventing injection vulnerabilities and enforcing strict schemas.",
                session_type: "RECORDED",
                dayOffset: 15,
                hour: 15,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-express-validation",
              },
            ],
          },
          {
            name: "Module 3: Relational Database Modeling with MySQL & Sequelize",
            description: "Database normalization, indexing, connection pooling, and complex joins.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Database Normalization, Foreign Keys & Constraints",
                description: "3NF database modeling, cascade rules, and generated columns.",
                session_type: "LIVE",
                dayOffset: 17,
                hour: 10,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-mysql",
              },
              {
                title: "Sequelize ORM Associations, Migrations & Indexing",
                description: "Writing complex queries, 1-to-many, many-to-many joins, and query optimization.",
                session_type: "LIVE",
                dayOffset: 19,
                hour: 10,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-sequelize",
              },
              {
                title: "Query Optimization, B-Tree Indexes & Connection Pooling",
                description: "Optimizing throughput from 300 to 1,500 req/sec.",
                session_type: "RECORDED",
                dayOffset: 22,
                hour: 16,
                duration: 75,
                recording_url: "https://youtube.com/watch?v=demo-db-perf",
              },
            ],
          },
          {
            name: "Module 4: Full-Stack Project Capstone & Production Deployment",
            description: "Dockerizing apps, PM2 clustering, Nginx reverse proxy, and SSL/TLS.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Containerizing LMS Services with Docker & Compose",
                description: "Multi-stage builds, environment isolation, and network bridge setup.",
                session_type: "LIVE",
                dayOffset: 24,
                hour: 11,
                duration: 120,
                session_url: "https://meet.google.com/nsi-lms-docker",
              },
              {
                title: "PM2 Process Manager, Clustering & Zero-Downtime Reload",
                description: "Multi-core scaling and automated process crash recovery.",
                session_type: "LIVE",
                dayOffset: 26,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-lms-pm2",
              },
              {
                title: "Deploying with Nginx Reverse Proxy, Certbot SSL & Cloudflare",
                description: "Production domain DNS routing and HTTPS encryption.",
                session_type: "RECORDED",
                dayOffset: 28,
                hour: 15,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-nginx-deploy",
              },
            ],
          },
        ],
      },
      {
        code: "CCDA-02",
        name: "Cloud Computing & DevOps Architecture",
        description: "Hands-on cloud engineering covering AWS services, Kubernetes orchestration, Terraform, and CI/CD.",
        duration: "5 Months",
        batch: {
          name: "CCDA-2026-Cohort-A",
          description: "Weekend professional batch for DevOps and Cloud practitioners.",
          start_date: "2026-09-05",
          end_date: "2027-01-31",
          batch_mode: "ONLINE",
          batch_time: "EVENING",
          batch_schedule: "WEEKENDS",
        },
        instructorIdx: 1, // Dr. Aditi Sharma
        modules: [
          {
            name: "Module 1: AWS Cloud Architecture Fundamentals",
            description: "VPC networking, EC2 instances, S3 storage, and IAM security policies.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "AWS VPC Design, Subnets, Internet Gateways & Route Tables",
                description: "Building isolated cloud network topologies with private/public subnets.",
                session_type: "LIVE",
                dayOffset: 2,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-vpc",
              },
              {
                title: "EC2 Auto Scaling Groups & Application Load Balancers",
                description: "High availability setup, health check monitors, and SSL termination.",
                session_type: "LIVE",
                dayOffset: 4,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-alb",
              },
              {
                title: "AWS S3 Lifecycle Rules, Versioning & CloudFront CDN",
                description: "Global edge asset distribution and secure presigned URLs.",
                session_type: "RECORDED",
                dayOffset: 6,
                hour: 18,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-aws-s3",
              },
            ],
          },
          {
            name: "Module 2: Container Orchestration with Kubernetes (EKS)",
            description: "Pods, Deployments, Services, Ingress Controllers, and ConfigMaps.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Kubernetes Pod Architecture, ReplicaSets & Deployments",
                description: "Declarative cluster workloads and rolling update strategies.",
                session_type: "LIVE",
                dayOffset: 9,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-k8s",
              },
              {
                title: "Cluster Networking, Services (ClusterIP/NodePort) & Ingress",
                description: "Routing ingress HTTP traffic to internal microservices.",
                session_type: "LIVE",
                dayOffset: 11,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-ingress",
              },
              {
                title: "Kubernetes Persistent Volumes & StatefulSets",
                description: "Running stateful workloads like Redis and MySQL on k8s.",
                session_type: "RECORDED",
                dayOffset: 14,
                hour: 18,
                duration: 75,
                recording_url: "https://youtube.com/watch?v=demo-k8s-volumes",
              },
            ],
          },
          {
            name: "Module 3: Infrastructure as Code (IaC) with Terraform",
            description: "Terraform HCL, state management, modules, and multi-environment setups.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "Terraform Providers, Resources, Variables & Outputs",
                description: "Writing reproducible infrastructure blueprints.",
                session_type: "LIVE",
                dayOffset: 16,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-tf",
              },
              {
                title: "Remote State Locking with S3 and DynamoDB",
                description: "Collaborative infrastructure management without state conflicts.",
                session_type: "LIVE",
                dayOffset: 18,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-state",
              },
              {
                title: "Reusable Terraform Modules for VPC & Kubernetes Clusters",
                description: "Packaging infrastructure components for dev, staging, and prod.",
                session_type: "RECORDED",
                dayOffset: 21,
                hour: 18,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-tf-modules",
              },
            ],
          },
          {
            name: "Module 4: Enterprise CI/CD Pipelines & Observability",
            description: "GitHub Actions, Prometheus, Grafana, and automated release gates.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "Automated Build, Test & Lint with GitHub Actions",
                description: "Continuous integration workflows with caching and matrix builds.",
                session_type: "LIVE",
                dayOffset: 23,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-actions",
              },
              {
                title: "Automated Image Publishing to Docker Hub & ECR",
                description: "Secure credential handshakes and semantic version tagging.",
                session_type: "LIVE",
                dayOffset: 25,
                hour: 17,
                duration: 90,
                session_url: "https://meet.google.com/nsi-devops-ecr",
              },
              {
                title: "Cluster Monitoring with Prometheus Metrics & Grafana Dashboards",
                description: "Visualizing CPU/memory pressure and setting up alerting channels.",
                session_type: "RECORDED",
                dayOffset: 29,
                hour: 18,
                duration: 80,
                recording_url: "https://youtube.com/watch?v=demo-grafana",
              },
            ],
          },
        ],
      },
      {
        code: "DSML-03",
        name: "Data Science & Machine Learning Engineering",
        description: "Python, NumPy, Pandas, Scikit-Learn, Deep Learning with PyTorch, and MLOps deployment.",
        duration: "6 Months",
        batch: {
          name: "DSML-2026-Cohort-A",
          description: "Intensive weekday batch with hands-on mathematical intuition and ML pipelines.",
          start_date: "2026-09-01",
          end_date: "2027-02-28",
          batch_mode: "ONLINE",
          batch_time: "MORNING",
          batch_schedule: "WEEKDAYS",
        },
        instructorIdx: 2, // Prof. Rohit Verma
        modules: [
          {
            name: "Module 1: Advanced Exploratory Data Analysis & Python Vectorization",
            description: "NumPy arrays, vectorized operations, Pandas DataFrames, and Seaborn visual analytics.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Vectorized Computations and Memory Layout in NumPy",
                description: "Broadcasting, memory striding, and fast linear algebraic computations.",
                session_type: "LIVE",
                dayOffset: 1,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-numpy",
              },
              {
                title: "Data Wrangling, Aggregation & Multi-Index DataFrames in Pandas",
                description: "Handling missing values, pivot tables, and high-performance groupby queries.",
                session_type: "LIVE",
                dayOffset: 3,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-pandas",
              },
              {
                title: "Statistical Feature Engineering & Outlier Detection",
                description: "Z-score analysis, IQR trimming, Box-Cox transformations, and PCA dimensionality reduction.",
                session_type: "RECORDED",
                dayOffset: 6,
                hour: 14,
                duration: 75,
                recording_url: "https://youtube.com/watch?v=demo-dsml-eda",
              },
            ],
          },
          {
            name: "Module 2: Supervised & Unsupervised Machine Learning Algorithms",
            description: "Regression, Decision Trees, Random Forests, XGBoost, and K-Means clustering.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Mathematical Foundations of Gradient Descent & Regularization",
                description: "Loss surfaces, L1/L2 penalties, and learning rate scheduling.",
                session_type: "LIVE",
                dayOffset: 8,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-descent",
              },
              {
                title: "Tree Ensemble Architectures: Random Forest vs Gradient Boosting (XGBoost)",
                description: "Feature importance, hyperparameter optimization, and cross-validation.",
                session_type: "LIVE",
                dayOffset: 11,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-trees",
              },
              {
                title: "Unsupervised Clustering & High-Dimensional Projections (t-SNE, UMAP)",
                description: "K-Means++, DBSCAN density clustering, and manifold learning.",
                session_type: "RECORDED",
                dayOffset: 13,
                hour: 15,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-dsml-clustering",
              },
            ],
          },
          {
            name: "Module 3: Deep Learning Architectures with PyTorch",
            description: "Neural networks, backpropagation, CNNs for computer vision, and Transformers.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Building Neural Networks from Scratch with PyTorch Tensors",
                description: "Autograd computational graphs, forward passes, and optimizer loops.",
                session_type: "LIVE",
                dayOffset: 15,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-pytorch",
              },
              {
                title: "Convolutional Neural Networks (CNNs) & Transfer Learning",
                description: "Residual networks (ResNet), data augmentation, and fine-tuning on custom imagery.",
                session_type: "LIVE",
                dayOffset: 18,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-cnn",
              },
              {
                title: "Self-Attention Mechanism & Transformer Foundations",
                description: "Multi-head attention, positional encodings, and BERT/GPT architectures.",
                session_type: "RECORDED",
                dayOffset: 20,
                hour: 16,
                duration: 90,
                recording_url: "https://youtube.com/watch?v=demo-dsml-transformers",
              },
            ],
          },
          {
            name: "Module 4: MLOps, Model Serving & Automated Retraining",
            description: "FastAPI model inference, ONNX optimization, Dockerization, and MLflow tracking.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Production Model Inference API with FastAPI & Pydantic",
                description: "High-throughput asynchronous model serving with latency profiling.",
                session_type: "LIVE",
                dayOffset: 22,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-fastapi",
              },
              {
                title: "Experiment Tracking & Model Registry with MLflow",
                description: "Versioning model weights, tracking metrics, and staging to production.",
                session_type: "LIVE",
                dayOffset: 25,
                hour: 9,
                duration: 90,
                session_url: "https://meet.google.com/nsi-dsml-mlflow",
              },
              {
                title: "Model Drift Monitoring & Automated CI/CD Retraining Pipelines",
                description: "Detecting covariate shift in real-time streaming data.",
                session_type: "RECORDED",
                dayOffset: 27,
                hour: 14,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-dsml-drift",
              },
            ],
          },
        ],
      },
      {
        code: "CSEH-04",
        name: "Cyber Security & Ethical Hacking",
        description: "Network penetration testing, Web application security (OWASP Top 10), Cryptography, and SOC operations.",
        duration: "4 Months",
        batch: {
          name: "CSEH-2026-Cohort-A",
          description: "Evening cohort focusing on offensive security, CTF labs, and defensive threat mitigation.",
          start_date: "2026-09-01",
          end_date: "2026-12-31",
          batch_mode: "HYBRID",
          batch_time: "EVENING",
          batch_schedule: "WEEKDAYS",
        },
        instructorIdx: 3, // Dr. Priya Nair
        modules: [
          {
            name: "Module 1: Network Security, Reconnaissance & Packet Analysis",
            description: "TCP/IP protocol vulnerabilities, Wireshark packet capture, and Nmap port scanning.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "TCP Handshake Vulnerabilities, SYN Floods & Network Sniffing",
                description: "Dissecting packet headers and understanding layer 3/4 security weaknesses.",
                session_type: "LIVE",
                dayOffset: 2,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-recon",
              },
              {
                title: "Advanced Nmap Scanning Techniques, NSE Scripts & Firewall Evasion",
                description: "Stealth scanning, timing templates, and service version detection.",
                session_type: "LIVE",
                dayOffset: 4,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-nmap",
              },
              {
                title: "Wireshark Protocol Analysis & Malicious Traffic Identification",
                description: "Filtering suspicious payloads, DNS exfiltration, and ARP spoofing.",
                session_type: "RECORDED",
                dayOffset: 7,
                hour: 20,
                duration: 75,
                recording_url: "https://youtube.com/watch?v=demo-wireshark",
              },
            ],
          },
          {
            name: "Module 2: Web Application Penetration Testing (OWASP Top 10)",
            description: "SQL Injection, Cross-Site Scripting (XSS), CSRF, SSRF, and Broken Access Control.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "SQL Injection Vectors: Union-Based, Error-Based & Blind Exploitation",
                description: "Understanding raw SQL parsing and remediation using parameterized queries.",
                session_type: "LIVE",
                dayOffset: 9,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-sqli",
              },
              {
                title: "Cross-Site Scripting (Reflected, Stored & DOM) & CSP Bypasses",
                description: "Session hijacking vectors and implementing strict Content Security Policies.",
                session_type: "LIVE",
                dayOffset: 12,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-xss",
              },
              {
                title: "Server-Side Request Forgery (SSRF) in Cloud Environments",
                description: "Attacking cloud metadata services (IMDSv1) and mitigating with IMDSv2 tokens.",
                session_type: "RECORDED",
                dayOffset: 14,
                hour: 20,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-ssrf",
              },
            ],
          },
          {
            name: "Module 3: Modern Cryptography & Public Key Infrastructure (PKI)",
            description: "Symmetric AES encryption, RSA, Elliptic Curve Cryptography (ECC), and TLS handshakes.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "Symmetric Ciphers: AES-GCM Mode vs CBC Mode with HMAC",
                description: "Block cipher padding oracle attacks and authenticated encryption schemes.",
                session_type: "LIVE",
                dayOffset: 16,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-crypto",
              },
              {
                title: "Asymmetric Cryptography: Diffie-Hellman Key Exchange & RSA Math",
                description: "Discrete logarithm problem and zero-knowledge mathematical intuition.",
                session_type: "LIVE",
                dayOffset: 19,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-pki",
              },
              {
                title: "TLS 1.3 Handshake Protocol & Perfect Forward Secrecy",
                description: "Certificate pinning, mutual TLS (mTLS), and quantum-resistant algorithms.",
                session_type: "RECORDED",
                dayOffset: 21,
                hour: 20,
                duration: 70,
                recording_url: "https://youtube.com/watch?v=demo-tls13",
              },
            ],
          },
          {
            name: "Module 4: Incident Response & Security Operations Center (SOC)",
            description: "SIEM log analysis, threat hunting, YARA rules, and digital forensics.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "SIEM Architecture: Ingesting & Correlating Syslog & Auditd Logs",
                description: "Writing detection rules for lateral movement and credential dumping.",
                session_type: "LIVE",
                dayOffset: 23,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-siem",
              },
              {
                title: "Memory Forensics with Volatility: Extracting Process Artifacts",
                description: "Detecting injected DLLs, rootkits, and unlinking malicious process descriptors.",
                session_type: "LIVE",
                dayOffset: 26,
                hour: 19,
                duration: 90,
                session_url: "https://meet.google.com/nsi-cseh-volatility",
              },
              {
                title: "Writing YARA Rules for Malware Signature Matching",
                description: "Hex pattern hunting and automated endpoint response triggers.",
                session_type: "RECORDED",
                dayOffset: 28,
                hour: 20,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-yara",
              },
            ],
          },
        ],
      },
      {
        code: "MADF-05",
        name: "Mobile App Development with Flutter & React Native",
        description: "Cross-platform mobile engineering with Flutter, Dart, React Native, Expo, and native device APIs.",
        duration: "5 Months",
        batch: {
          name: "MADF-2026-Cohort-A",
          description: "Morning cohort covering native UI rendering, state management, and app store deployment.",
          start_date: "2026-09-01",
          end_date: "2027-01-31",
          batch_mode: "ONLINE",
          batch_time: "MORNING",
          batch_schedule: "WEEKDAYS",
        },
        instructorIdx: 0, // Instructor Faculty
        modules: [
          {
            name: "Module 1: Flutter Framework & Dart Language Architecture",
            description: "Stateless vs Stateful widgets, widget tree rendering, Dart asynchronous streams.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "Dart Type System, Null Safety, Mixins & Async Streams",
                description: "Asynchronous programming with Futures, Streams, and isolates.",
                session_type: "LIVE",
                dayOffset: 2,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-flutter-dart",
              },
              {
                title: "Flutter RenderObject Pipeline & Custom Canvas Drawing",
                description: "Understanding how Flutter paints 120fps UI directly via Skia/Impeller.",
                session_type: "LIVE",
                dayOffset: 5,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-flutter-render",
              },
              {
                title: "Responsive Layouts with MediaQuery, LayoutBuilder & Flex",
                description: "Designing adaptive user interfaces for phones, foldables, and tablets.",
                session_type: "RECORDED",
                dayOffset: 7,
                hour: 14,
                duration: 60,
                recording_url: "https://youtube.com/watch?v=demo-flutter-layout",
              },
            ],
          },
          {
            name: "Module 2: Advanced State Management (Bloc & Riverpod)",
            description: "Event-driven state machines, dependency injection, and scalable state separation.",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Building Predictable UIs with BLoC Pattern & HydratedBloc",
                description: "Event-to-state transformations and automatic state persistence.",
                session_type: "LIVE",
                dayOffset: 10,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-flutter-bloc",
              },
              {
                title: "Riverpod 2.0: Scoped Providers, Code Generation & Family Modifiers",
                description: "Compile-safe dependency injection without BuildContext lookups.",
                session_type: "LIVE",
                dayOffset: 13,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-flutter-riverpod",
              },
              {
                title: "Unit Testing BLoCs & Widget Test Automation with Golden Tests",
                description: "Writing automated regression tests for complex multi-screen flows.",
                session_type: "RECORDED",
                dayOffset: 15,
                hour: 16,
                duration: 75,
                recording_url: "https://youtube.com/watch?v=demo-flutter-testing",
              },
            ],
          },
          {
            name: "Module 3: Native Device Hardware Integration & Background Tasks",
            description: "Camera access, Geolocation, SQLite offline sync, and Push Notifications (FCM).",
            duration: "4 Weeks",
            lectures: [
              {
                title: "Offline-First Local Storage with Drift SQLite & Hive NoSQL",
                description: "Bidirectional background data synchronization when internet is restored.",
                session_type: "LIVE",
                dayOffset: 17,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-flutter-sqlite",
              },
              {
                title: "Device GPS Geolocation, Background Location Tracking & Geofencing",
                description: "Power-efficient native battery management and location stream filters.",
                session_type: "LIVE",
                dayOffset: 20,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-flutter-gps",
              },
              {
                title: "Firebase Cloud Messaging (FCM) & Silent Push Triggers",
                description: "High-priority push notifications and handling deep-links into app states.",
                session_type: "RECORDED",
                dayOffset: 22,
                hour: 15,
                duration: 65,
                recording_url: "https://youtube.com/watch?v=demo-flutter-fcm",
              },
            ],
          },
          {
            name: "Module 4: React Native with Expo & App Store Deployment",
            description: "React Native New Architecture (Fabric & TurboModules), Expo EAS Build, and Play Store.",
            duration: "3 Weeks",
            lectures: [
              {
                title: "React Native New Architecture: JSI, TurboModules & Fabric Renderer",
                description: "Direct C++ thread communication eliminating the legacy JSON bridge.",
                session_type: "LIVE",
                dayOffset: 24,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-rn-arch",
              },
              {
                title: "Cloud App Bundling & OTA Updates with Expo Application Services (EAS)",
                description: "Over-the-air JavaScript patching without app store re-review delays.",
                session_type: "LIVE",
                dayOffset: 27,
                hour: 11,
                duration: 90,
                session_url: "https://meet.google.com/nsi-rn-eas",
              },
              {
                title: "Google Play Store & Apple App Store Publishing Checklist",
                description: "Code signing keystores, provisioning profiles, and privacy declarations.",
                session_type: "RECORDED",
                dayOffset: 30,
                hour: 16,
                duration: 80,
                recording_url: "https://youtube.com/watch?v=demo-app-store",
              },
            ],
          },
        ],
      },
    ];

    const seededBatches = [];

    const baseDate = new Date(2026, 8, 8); // September 8, 2026

    for (let cIdx = 0; cIdx < courseDefs.length; cIdx++) {
      const cDef = courseDefs[cIdx];
      let course = await Course.findOne({ where: { code: cDef.code } });
      if (!course) {
        course = await Course.create({
          code: cDef.code,
          name: cDef.name,
          description: cDef.description,
          duration: cDef.duration,
          status: "ACTIVE",
          created_by: admin.id,
          updated_by: admin.id,
        });
        console.log(`Created Course: [${course.code}] ${course.name}`);
      }

      // Batch
      let batch = await CourseBatch.findOne({ where: { course_id: course.id } });
      if (!batch) {
        batch = await CourseBatch.create({
          course_id: course.id,
          name: cDef.batch.name,
          description: cDef.batch.description,
          start_date: cDef.batch.start_date,
          end_date: cDef.batch.end_date,
          batch_mode: cDef.batch.batch_mode,
          batch_time: cDef.batch.batch_time,
          batch_schedule: cDef.batch.batch_schedule,
          status: "ACTIVE",
          created_by: admin.id,
          updated_by: admin.id,
        });
        await batch.reload();
        console.log(`Created Batch: ${batch.name} (${batch.batch_code})`);
      }
      seededBatches.push(batch);

      // Assign Instructor
      const assignedInstructor = instructors[cDef.instructorIdx] || instructors[0];
      let instructorAssign = await CourseInstructor.findOne({
        where: { batch_id: batch.id, instructor_id: assignedInstructor.id },
      });
      if (!instructorAssign) {
        instructorAssign = await CourseInstructor.create({
          batch_id: batch.id,
          instructor_id: assignedInstructor.id,
          status: "ACTIVE",
          assigned_at: new Date(),
          assigned_by: admin.id,
          updated_by: admin.id,
        });
        console.log(`Assigned ${assignedInstructor.first_name} ${assignedInstructor.last_name} to ${batch.name}`);
      }

      // Modules & Lectures
      for (let mIdx = 0; mIdx < cDef.modules.length; mIdx++) {
        const mDef = cDef.modules[mIdx];
        let module = await CourseModule.findOne({
          where: { course_id: course.id, name: mDef.name },
        });
        if (!module) {
          module = await CourseModule.create({
            course_id: course.id,
            name: mDef.name,
            description: mDef.description,
            duration: mDef.duration,
            display_order: mIdx + 1,
            status: "ACTIVE",
            created_by: assignedInstructor.id,
            updated_by: assignedInstructor.id,
          });
          console.log(`  Created Module ${mIdx + 1}: ${module.name}`);
        }

        // Lectures
        for (let lIdx = 0; lIdx < mDef.lectures.length; lIdx++) {
          const lDef = mDef.lectures[lIdx];
          let lecture = await Lecture.findOne({
            where: { module_id: module.id, title: lDef.title },
          });

          // Calculate scheduled date
          const scheduledDate = new Date(baseDate);
          scheduledDate.setDate(baseDate.getDate() + lDef.dayOffset);
          scheduledDate.setHours(lDef.hour, 0, 0, 0);

          if (!lecture) {
            lecture = await Lecture.create({
              module_id: module.id,
              instructor_id: assignedInstructor.id,
              title: lDef.title,
              description: lDef.description,
              session_type: lDef.session_type,
              status: "PUBLISHED",
              display_order: lIdx + 1,
              scheduled_at: scheduledDate,
              duration_minutes: lDef.duration,
              session_url: lDef.session_url || null,
              recording_url: lDef.recording_url || null,
              created_by: assignedInstructor.id,
              updated_by: assignedInstructor.id,
            });

            // Note
            await LectureNote.create({
              session_id: lecture.id,
              title: `${lDef.title} — Architecture Notes & Code Cheatsheet`,
              note_type: "LINK",
              external_url: "https://github.com/topics/full-stack",
              display_order: 1,
              status: "ACTIVE",
              created_by: assignedInstructor.id,
              updated_by: assignedInstructor.id,
            });
          }
        }
      }
    }

    // =========================================================================
    // 4. ENROLL STUDENTS (Varying: All 5 courses, 2 courses, 1 course)
    // =========================================================================
    console.log("--- Enrolling 25 Students into Batches ---");
    let enrollCount = 0;

    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const student = students[sIdx];
      let batchesToEnroll = [];

      if (sIdx < 5) {
        // Students 0-4 (including student@nsiit.com) enrolled in ALL 5 COURSES
        batchesToEnroll = [0, 1, 2, 3, 4];
      } else if (sIdx < 15) {
        // Students 5-14 enrolled in 2 COURSES
        const first = sIdx % 5;
        const second = (sIdx + 2) % 5;
        batchesToEnroll = [first, second];
      } else {
        // Students 15-24 enrolled in 1 SINGLE COURSE
        batchesToEnroll = [sIdx % 5];
      }

      for (const bIndex of batchesToEnroll) {
        const targetBatch = seededBatches[bIndex];
        let enrollment = await CourseStudent.findOne({
          where: { batch_id: targetBatch.id, student_id: student.id },
        });

        if (!enrollment) {
          enrollment = await CourseStudent.create({
            batch_id: targetBatch.id,
            student_id: student.id,
            status: "ACTIVE",
            enrollment_date: new Date(),
            created_by: admin.id,
            updated_by: admin.id,
          });
          enrollCount++;
        }
      }
    }

    console.log(`Enrolled ${students.length} students across 5 course batches (total ${enrollCount} new enrollments created).`);

    console.log("\n==========================================================");
    console.log("             COMPREHENSIVE LMS SEEDING COMPLETED!         ");
    console.log("==========================================================");
    console.log("Courses Seeded: 5 Courses with 4 Modules each (16-20 Lectures/Course)");
    console.log("Batches Seeded: 5 Active Batches with varied delivery modes");
    console.log("Instructors Seeded: 4 Instructors (Password: Instructor@123)");
    console.log("Students Seeded: 25 Students (Password: Student@123)");
    console.log("Enrollment Distribution:");
    console.log("  - Students 1 to 5 (including student@nsi): Enrolled in ALL 5 Courses");
    console.log("  - Students 6 to 15: Enrolled in 2 Courses");
    console.log("  - Students 16 to 25: Enrolled in 1 Single Course");
    console.log("==========================================================\n");

  } catch (error) {
    console.error("Seeding failed with error:", error);
  } finally {
    await sequelize.close();
  }
}

seedRichData();
