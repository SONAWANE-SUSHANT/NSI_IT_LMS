const bcrypt = require("bcryptjs");
const sequelize = require("./config/database");
const { User, UserRole } = require("./models");

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    // ==========================================
    // GET ROLES
    // ==========================================

    const adminRole = await UserRole.findOne({ where: { name: "ADMIN" } });
    const instructorRole = await UserRole.findOne({ where: { name: "INSTRUCTOR" } });
    const studentRole = await UserRole.findOne({ where: { name: "STUDENT" } });

    if (!adminRole || !instructorRole || !studentRole) {
      throw new Error("Roles not configured. Please run migrations first.");
    }

    // ==========================================
    // 1. SEED ADMIN
    // ==========================================
    let admin = await User.findOne({ where: { email: "admin@nsiit.com" } });
    if (!admin) {
      const passwordHash = await bcrypt.hash("Admin@123", 10);
      admin = await User.create({
        first_name: "Admin",

        last_name: "Administrator",
        email: "sushant@nsi",
        password: passwordHash,
        role_id: adminRole.id,
        contact_no: "9999999999",
        gender: "OTHER",
        status: "ACTIVE",
      });
      console.log("Admin created successfully.");
    } else {
      console.log("Admin user already exists.");
    }

    // ==========================================
    // 2. SEED INSTRUCTOR
    // ==========================================
    let instructor = await User.findOne({ where: { email: "instructor@nsiit.com" } });
    if (!instructor) {
      const passwordHash = await bcrypt.hash("Instructor@123", 10);
      instructor = await User.create({
        first_name: "Instructor",
        last_name: "Faculty",
        email: "instructor@nsiit.com",
        password: passwordHash,
        role_id: instructorRole.id,
        contact_no: "9888888888",
        gender: "MALE",
        status: "ACTIVE",
        created_by: admin.id,
        updated_by: admin.id,
      });
      console.log("Instructor created successfully.");
    } else {
      console.log("Instructor user already exists.");
    }

    // ==========================================
    // 3. SEED STUDENT
    // ==========================================
    let student = await User.findOne({ where: { email: "student@nsiit.com" } });
    if (!student) {
      const passwordHash = await bcrypt.hash("Student@123", 10);
      student = await User.create({
        first_name: "Student",
        last_name: "Learner",
        email: "student@nsiit.com",
        password: passwordHash,
        role_id: studentRole.id,
        contact_no: "9777777777",
        gender: "FEMALE",
        status: "ACTIVE",
        created_by: admin.id,
        updated_by: admin.id,
      });
      console.log("Student created successfully.");
    } else {
      console.log("Student user already exists.");
    }

    console.log("\n================================");
    console.log("   NSI IT LMS TEST ACCOUNTS");
    console.log("================================");
    console.log("\nADMIN: admin@nsiit.com / admin@nsi | Admin@123");
    console.log("INSTRUCTOR: instructor@nsiit.com / instructor@nsi | Instructor@123");
    console.log("STUDENT: student@nsiit.com / student@nsi | Student@123");
    console.log("================================\n");

  } catch (error) {
    console.error("\nSeeding failed:", error);
  } finally {
    await sequelize.close();
  }
};

seedUsers();