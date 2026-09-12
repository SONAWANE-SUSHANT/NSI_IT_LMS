const { User, UserDevice } = require('../models');
const { handleStudentDeviceLogin, getUserDevices, revokeUserDevice } = require('../services/device.service');

async function testDeviceManagement() {
  try {
    console.log('--- Starting Device Management Test ---');

    // Find or pick a student user
    const student = await User.findOne({ where: { role_id: 3 } });
    if (!student) {
      console.log('No student user found in DB to test.');
      process.exit(0);
    }
    console.log('Testing with student:', student.id, student.email);

    // Clean any existing test devices for this student
    await UserDevice.destroy({ where: { user_id: student.id } });

    // 1. First Device Login
    const req1 = {
      body: {
        device_id: 'test-device-uuid-1',
        device_name: 'Windows Laptop',
        device_type: 'LAPTOP',
        browser: 'Chrome 128',
        operating_system: 'Windows 11',
      },
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      ip: '192.168.1.10',
    };
    const res1 = await handleStudentDeviceLogin(student, req1);
    console.log('Device 1 login result:', res1.success, res1.device.device_name, res1.device.status);

    // 2. Second Device Login
    const req2 = {
      body: {
        device_id: 'test-device-uuid-2',
        device_name: 'MacBook Pro',
        device_type: 'LAPTOP',
        browser: 'Safari 17',
        operating_system: 'macOS Sonoma',
      },
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      ip: '192.168.1.20',
    };
    const res2 = await handleStudentDeviceLogin(student, req2);
    console.log('Device 2 login result:', res2.success, res2.device.device_name, res2.device.status);

    // 3. Third Device Login -> Should be REJECTED!
    const req3 = {
      body: {
        device_id: 'test-device-uuid-3',
        device_name: 'Samsung Galaxy Phone',
        device_type: 'MOBILE',
        browser: 'Chrome Mobile',
        operating_system: 'Android 14',
      },
      headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14)' },
      ip: '192.168.1.30',
    };
    try {
      await handleStudentDeviceLogin(student, req3);
      console.error('ERROR: Device 3 login should have been rejected!');
    } catch (err) {
      console.log('SUCCESS: Device 3 login correctly rejected!');
      console.log('Status code:', err.statusCode, 'Message:', err.message);
    }

    // 4. Device 1 logs in again -> Should succeed and update timestamp
    const res1Again = await handleStudentDeviceLogin(student, req1);
    console.log('Device 1 re-login succeeded:', res1Again.success, 'last_active_at:', res1Again.device.last_active_at);

    // 5. Admin revokes Device 1
    const revoked = await revokeUserDevice(student.id, res1.device.id);
    console.log('Admin revoked device 1. New status:', revoked.status);

    // 6. Device 3 logs in now -> Should succeed since active devices is now 1 (< 2)!
    const res3 = await handleStudentDeviceLogin(student, req3);
    console.log('Device 3 login after revocation succeeded:', res3.success, res3.device.device_name, res3.device.status);

    // 7. Check all devices
    const allDevices = await getUserDevices(student.id);
    console.log('All student devices count:', allDevices.length);
    console.log(allDevices.map(d => ({ id: d.id, name: d.device_name, browser: d.browser, os: d.operating_system, status: d.status })));

    console.log('--- ALL DEVICE MANAGEMENT TESTS PASSED! ---');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testDeviceManagement();
