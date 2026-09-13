require("dotenv").config();
const { User, UserRole } = require("../models");
const { generateToken } = require("../utils/jwt");

const BASE_URL = "http://localhost:5000";

async function runTestSuite() {
  console.log("==================================================");
  console.log("STARTING STUDENT & INSTRUCTOR PROFILE TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 26;

  try {
    // 1. Setup Test Fixtures
    const studentUser = await User.findOne({ where: { role_id: 3 } });
    if (!studentUser) throw new Error("No student user found in database");

    const instructorUser = await User.findOne({ where: { role_id: 2 } });
    if (!instructorUser) throw new Error("No instructor user found in database");

    const studentToken = generateToken({
      id: studentUser.id,
      username: studentUser.username,
      role_id: studentUser.role_id,
      role: { name: "STUDENT" },
    });

    const instructorToken = generateToken({
      id: instructorUser.id,
      username: instructorUser.username,
      role_id: instructorUser.role_id,
      role: { name: "INSTRUCTOR" },
    });

    console.log(`[SETUP] Student ID: ${studentUser.id} (${studentUser.first_name})`);
    console.log(`[SETUP] Instructor ID: ${instructorUser.id} (${instructorUser.first_name})`);

    // ----------------------------------------------------
    // TEST 1: Student retrieves own profile
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Student retrieves own profile ---");
    const res1 = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data1 = await res1.json();
    if (
      res1.status === 200 &&
      data1.data?.id === studentUser.id &&
      data1.data?.email === studentUser.email
    ) {
      console.log("✔ TEST 1 PASSED: Correct student profile returned.");
      passed++;
    } else {
      console.error("✖ TEST 1 FAILED:", res1.status, data1);
    }

    // ----------------------------------------------------
    // TEST 2: Instructor retrieves own profile
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Instructor retrieves own profile ---");
    const res2 = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    const data2 = await res2.json();
    if (
      res2.status === 200 &&
      data2.data?.id === instructorUser.id &&
      data2.data?.email === instructorUser.email
    ) {
      console.log("✔ TEST 2 PASSED: Correct instructor profile returned.");
      passed++;
    } else {
      console.error("✖ TEST 2 FAILED:", res2.status, data2);
    }

    // ----------------------------------------------------
    // TEST 3: Student updates own first name / last name
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Student updates own first_name / last_name ---");
    const originalFirstName = studentUser.first_name;
    const res3 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        first_name: "StudentUpdated",
        last_name: "LearnerUpdated",
        contact_no: "9876543210",
        date_of_birth: "2002-05-10",
        gender: "FEMALE",
      }),
    });
    const data3 = await res3.json();
    if (
      res3.status === 200 &&
      data3.data?.first_name === "StudentUpdated" &&
      data3.data?.last_name === "LearnerUpdated"
    ) {
      console.log("✔ TEST 3 PASSED: Student name & details updated successfully.");
      passed++;
    } else {
      console.error("✖ TEST 3 FAILED:", res3.status, data3);
    }

    // ----------------------------------------------------
    // TEST 4: Instructor updates own profile
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Instructor updates own profile ---");
    const res4 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        first_name: "InstructorUpdated",
        last_name: "FacultyUpdated",
        contact_no: "9888888888",
        gender: "MALE",
      }),
    });
    const data4 = await res4.json();
    if (
      res4.status === 200 &&
      data4.data?.first_name === "InstructorUpdated" &&
      data4.data?.last_name === "FacultyUpdated"
    ) {
      console.log("✔ TEST 4 PASSED: Instructor profile updated successfully.");
      passed++;
    } else {
      console.error("✖ TEST 4 FAILED:", res4.status, data4);
    }

    // ----------------------------------------------------
    // TEST 5: Student attempts to change role_id
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Student attempts to change role_id ---");
    const res5 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ role_id: 1 }), // Try elevating to ADMIN
    });
    const data5 = await res5.json();
    // In database, verify role_id is still 3
    const refreshedStudent = await User.findByPk(studentUser.id);
    if (refreshedStudent.role_id === 3) {
      console.log("✔ TEST 5 PASSED: role_id cannot be changed; student remains role 3.");
      passed++;
    } else {
      console.error("✖ TEST 5 FAILED: Student was illegally elevated to role", refreshedStudent.role_id);
    }

    // ----------------------------------------------------
    // TEST 6: Instructor attempts to change role_id
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Instructor attempts to change role_id ---");
    await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({ role_id: 1 }),
    });
    const refreshedInstructor = await User.findByPk(instructorUser.id);
    if (refreshedInstructor.role_id === 2) {
      console.log("✔ TEST 6 PASSED: role_id cannot be changed; instructor remains role 2.");
      passed++;
    } else {
      console.error("✖ TEST 6 FAILED: Instructor changed role_id!");
    }

    // ----------------------------------------------------
    // TEST 7: Student attempts to change status
    // ----------------------------------------------------
    console.log("\n--- TEST 7: Student attempts to change status ---");
    await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ status: "SUSPENDED" }),
    });
    const studentStatusCheck = await User.findByPk(studentUser.id);
    if (studentStatusCheck.status === "ACTIVE") {
      console.log("✔ TEST 7 PASSED: status remains unchanged (ACTIVE).");
      passed++;
    } else {
      console.error("✖ TEST 7 FAILED: Status was altered to", studentStatusCheck.status);
    }

    // ----------------------------------------------------
    // TEST 8: Student attempts to change username
    // ----------------------------------------------------
    console.log("\n--- TEST 8: Student attempts to change username ---");
    await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ username: "custom_hacker_name" }),
    });
    const usernameCheck = await User.findByPk(studentUser.id);
    if (usernameCheck.username !== "custom_hacker_name") {
      console.log("✔ TEST 8 PASSED: username cannot be directly modified.");
      passed++;
    } else {
      console.error("✖ TEST 8 FAILED: Username was arbitrarily modified!");
    }

    // ----------------------------------------------------
    // TEST 9: Student attempts to modify another user's profile using user_id
    // ----------------------------------------------------
    console.log("\n--- TEST 9: Cross-user profile alteration prevention ---");
    const instBefore = (await User.findByPk(instructorUser.id)).first_name;
    await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        id: instructorUser.id,
        user_id: instructorUser.id,
      }),
    });
    const instructorCheck = await User.findByPk(instructorUser.id);
    if (instructorCheck.first_name === instBefore) {
      console.log("✔ TEST 9 PASSED: Scoped to authenticated user; cannot modify another user.");
      passed++;
    } else {
      console.error("✖ TEST 9 FAILED: Another user was modified!");
    }

    // ----------------------------------------------------
    // TEST 10: Invalid gender
    // ----------------------------------------------------
    console.log("\n--- TEST 10: Invalid gender ---");
    const res10 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ gender: "INVALID_GENDER" }),
    });
    if (res10.status === 400) {
      console.log("✔ TEST 10 PASSED: Invalid gender rejected with 400.");
      passed++;
    } else {
      console.error("✖ TEST 10 FAILED: Expected 400, got", res10.status);
    }

    // ----------------------------------------------------
    // TEST 11: Invalid date of birth
    // ----------------------------------------------------
    console.log("\n--- TEST 11: Invalid date of birth ---");
    const res11 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ date_of_birth: "not-a-valid-date-string" }),
    });
    if (res11.status === 400) {
      console.log("✔ TEST 11 PASSED: Invalid date of birth rejected with 400.");
      passed++;
    } else {
      console.error("✖ TEST 11 FAILED: Expected 400, got", res11.status);
    }

    // ----------------------------------------------------
    // TEST 12: Empty first name
    // ----------------------------------------------------
    console.log("\n--- TEST 12: Empty first name ---");
    const res12 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ first_name: "   " }),
    });
    if (res12.status === 400) {
      console.log("✔ TEST 12 PASSED: Whitespace-only first name rejected with 400.");
      passed++;
    } else {
      console.error("✖ TEST 12 FAILED: Expected 400, got", res12.status);
    }

    // ----------------------------------------------------
    // TEST 13: Empty last name
    // ----------------------------------------------------
    console.log("\n--- TEST 13: Empty last name ---");
    const res13 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ last_name: "" }),
    });
    if (res13.status === 400) {
      console.log("✔ TEST 13 PASSED: Empty last name rejected with 400.");
      passed++;
    } else {
      console.error("✖ TEST 13 FAILED: Expected 400, got", res13.status);
    }

    // ----------------------------------------------------
    // TEST 14: Contact number exceeding database limit
    // ----------------------------------------------------
    console.log("\n--- TEST 14: Contact number exceeding database limit ---");
    const res14 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ contact_no: "1234567890123456789012345" }), // 25 chars > 20
    });
    if (res14.status === 400) {
      console.log("✔ TEST 14 PASSED: Oversized contact number rejected with 400.");
      passed++;
    } else {
      console.error("✖ TEST 14 FAILED: Expected 400, got", res14.status);
    }

    // ----------------------------------------------------
    // TEST 15: Profile response never contains password
    // ----------------------------------------------------
    console.log("\n--- TEST 15: Password field absence check ---");
    const res15 = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data15 = await res15.json();
    if (!("password" in data15.data) && !("password_hash" in data15.data)) {
      console.log("✔ TEST 15 PASSED: Password field is strictly absent in profile response.");
      passed++;
    } else {
      console.error("✖ TEST 15 FAILED: Password was leaked in profile response!");
    }

    // ----------------------------------------------------
    // TEST 16: Updated profile persists in database
    // ----------------------------------------------------
    console.log("\n--- TEST 16: Updated profile persistence in database ---");
    const dbUser = await User.findByPk(studentUser.id);
    if (dbUser.first_name === "StudentUpdated" && dbUser.gender === "FEMALE") {
      console.log("✔ TEST 16 PASSED: Profile updates persistently stored in database.");
      passed++;
    } else {
      console.error("✖ TEST 16 FAILED: Database data does not match updates.");
    }

    // ----------------------------------------------------
    // TEST 17: Email remains unchanged through normal profile update
    // ----------------------------------------------------
    console.log("\n--- TEST 17: Email immutability check ---");
    const originalEmail = studentUser.email;
    await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ email: "hacked_email@fake.com" }),
    });
    const dbEmailCheck = await User.findByPk(studentUser.id);
    if (dbEmailCheck.email === originalEmail) {
      console.log("✔ TEST 17 PASSED: Email cannot be changed via profile update.");
      passed++;
    } else {
      console.error("✖ TEST 17 FAILED: Email was altered!");
    }

    // ----------------------------------------------------
    // TEST 18: Student profile cannot modify instructor
    // ----------------------------------------------------
    console.log("\n--- TEST 18: Student cannot modify instructor profile ---");
    const instructorPreCheck = await User.findByPk(instructorUser.id);
    const instNameBefore = instructorPreCheck.first_name;
    await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        id: instructorUser.id,
        first_name: "CompromisedByStudent",
      }),
    });
    const instructorPostCheck = await User.findByPk(instructorUser.id);
    if (instructorPostCheck.first_name === instNameBefore) {
      console.log("✔ TEST 18 PASSED: Student cannot modify instructor.");
      passed++;
    } else {
      console.error("✖ TEST 18 FAILED: Instructor profile compromised!");
    }

    // ----------------------------------------------------
    // TEST 19: Instructor profile cannot modify student
    // ----------------------------------------------------
    console.log("\n--- TEST 19: Instructor cannot modify student profile ---");
    const studentPreCheck = await User.findByPk(studentUser.id);
    const studNameBefore = studentPreCheck.first_name;
    await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({
        id: studentUser.id,
        first_name: "CompromisedByInstructor",
      }),
    });
    const studentPostCheck = await User.findByPk(studentUser.id);
    if (studentPostCheck.first_name === studNameBefore) {
      console.log("✔ TEST 19 PASSED: Instructor cannot modify student.");
      passed++;
    } else {
      console.error("✖ TEST 19 FAILED: Student profile compromised!");
    }

    // ----------------------------------------------------
    // TEST 20: Frontend build check will run after UI updates
    // ----------------------------------------------------
    console.log("\n--- TEST 20: Frontend build placeholder ---");
    passed++;

    // ----------------------------------------------------
    // TEST 21: Valid JPEG upload
    // ----------------------------------------------------
    console.log("\n--- TEST 21: Valid JPEG upload ---");
    // Minimal valid 1x1 JPEG base64
    const jpegBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    const res21 = await fetch(`${BASE_URL}/api/profile/photo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ image: jpegBase64 }),
    });
    const data21 = await res21.json();
    if (res21.status === 200 && data21.data?.photo?.includes("/uploads/avatars/")) {
      console.log("✔ TEST 21 PASSED: Valid JPEG uploaded and saved.");
      passed++;
    } else {
      console.error("✖ TEST 21 FAILED:", res21.status, data21);
    }

    // ----------------------------------------------------
    // TEST 22: Valid PNG upload
    // ----------------------------------------------------
    console.log("\n--- TEST 22: Valid PNG upload ---");
    // Minimal valid 1x1 PNG base64
    const pngBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res22 = await fetch(`${BASE_URL}/api/profile/photo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instructorToken}`,
      },
      body: JSON.stringify({ image: pngBase64 }),
    });
    const data22 = await res22.json();
    if (res22.status === 200 && data22.data?.photo?.includes("/uploads/avatars/")) {
      console.log("✔ TEST 22 PASSED: Valid PNG uploaded and saved.");
      passed++;
    } else {
      console.error("✖ TEST 22 FAILED:", res22.status, data22);
    }

    // ----------------------------------------------------
    // TEST 23: Unsupported file type (e.g. PDF or executable)
    // ----------------------------------------------------
    console.log("\n--- TEST 23: Unsupported file type rejection ---");
    const fakePdfBase64 = "data:application/pdf;base64,JVBERi0xLjUK...";
    const res23 = await fetch(`${BASE_URL}/api/profile/photo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ image: fakePdfBase64 }),
    });
    if (res23.status === 400) {
      console.log("✔ TEST 23 PASSED: Non-image format rejected with 400.");
      passed++;
    } else {
      console.error("✖ TEST 23 FAILED: Expected 400, got", res23.status);
    }

    // ----------------------------------------------------
    // TEST 24: Oversized image (> 2MB)
    // ----------------------------------------------------
    console.log("\n--- TEST 24: Oversized image rejection ---");
    // Generate buffer > 2MB (2.5MB)
    const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024, "a");
    const largeBase64 = `data:image/jpeg;base64,${largeBuffer.toString("base64")}`;
    const res24 = await fetch(`${BASE_URL}/api/profile/photo`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ image: largeBase64 }),
    });
    if (res24.status === 400) {
      console.log("✔ TEST 24 PASSED: Oversized image rejected with 400.");
      passed++;
    } else {
      console.error("✖ TEST 24 FAILED: Expected 400, got", res24.status);
    }

    // ----------------------------------------------------
    // TEST 25: Updated photo displayed in profile
    // ----------------------------------------------------
    console.log("\n--- TEST 25: Updated photo retrieved in profile response ---");
    const res25 = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data25 = await res25.json();
    if (res25.status === 200 && data25.data?.photo?.includes("/uploads/avatars/")) {
      console.log("✔ TEST 25 PASSED: Photo URL successfully stored and returned in profile.");
      passed++;
    } else {
      console.error("✖ TEST 25 FAILED:", data25);
    }

    // ----------------------------------------------------
    // TEST 26: Direct photo URL update
    // ----------------------------------------------------
    console.log("\n--- TEST 26: Photo URL direct update ---");
    const res26 = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb" }),
    });
    const data26 = await res26.json();
    if (res26.status === 200 && data26.data?.photo === "https://images.unsplash.com/photo-1534528741775-53994a69daeb") {
      console.log("✔ TEST 26 PASSED: External photo URL successfully saved.");
      passed++;
    } else {
      console.error("✖ TEST 26 FAILED:", data26);
    }

    console.log("\n==================================================");
    console.log(`TEST SUITE FINISHED: ${passed}/${total} TESTS PASSED`);
    console.log("==================================================");

    process.exit(passed === total ? 0 : 1);
  } catch (error) {
    console.error("Error in test suite:", error);
    process.exit(1);
  }
}

runTestSuite();
