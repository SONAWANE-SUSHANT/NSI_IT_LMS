const DEVICE_ID_KEY = 'nsi_device_id';

function getPersistentDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `nsi-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

function getBrowser(userAgent = navigator.userAgent) {
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) return 'Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
  return 'Unknown Browser';
}

function getOperatingSystem(userAgent = navigator.userAgent) {
  if (/Windows NT/i.test(userAgent)) return 'Windows';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown OS';
}

function getDeviceType(userAgent = navigator.userAgent) {
  if (/iPad|Tablet/i.test(userAgent)) return 'TABLET';
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(userAgent)) return 'MOBILE';
  if (/Laptop|Windows NT|Macintosh/i.test(userAgent)) return 'LAPTOP';
  return 'DESKTOP';
}

function getDeviceName(type, operatingSystem) {
  if (type === 'MOBILE') return `${operatingSystem} Phone`;
  if (type === 'TABLET') return `${operatingSystem} Tablet`;
  if (type === 'LAPTOP') return `${operatingSystem} Laptop`;
  return `${operatingSystem} Desktop`;
}

export function getDeviceInfo() {
  const userAgent = navigator.userAgent || '';
  const operatingSystem = getOperatingSystem(userAgent);
  const deviceType = getDeviceType(userAgent);

  return {
    device_id: getPersistentDeviceId(),
    device_name: getDeviceName(deviceType, operatingSystem),
    device_type: deviceType,
    browser: getBrowser(userAgent),
    operating_system: operatingSystem,
  };
}
