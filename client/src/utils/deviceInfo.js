/**
 * Device information and persistent device ID utility
 */

const DEVICE_STORAGE_KEY = 'nsi_lms_device_id';

/**
 * Returns or generates a persistent device UUID stored in localStorage
 */
export function getDeviceId() {
  try {
    let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return 'fallback_device_' + Date.now();
  }
}

/**
 * Parses browser, OS, device type and user-friendly name from navigator
 */
export function getClientDeviceInfo() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const device_id = getDeviceId();

  // 1. Operating System
  let operating_system = 'Windows';
  if (/windows nt 10/i.test(ua)) operating_system = 'Windows 11 / 10';
  else if (/windows/i.test(ua)) operating_system = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) operating_system = 'macOS';
  else if (/android/i.test(ua)) operating_system = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) operating_system = 'iOS';
  else if (/linux/i.test(ua)) operating_system = 'Linux';

  // 2. Browser
  let browser = 'Chrome';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  // 3. Device Type
  let device_type = 'LAPTOP';
  if (/tablet|ipad/i.test(ua)) device_type = 'TABLET';
  else if (/mobile|iphone|android/i.test(ua)) device_type = 'MOBILE';
  else if (typeof screen !== 'undefined' && screen.width > 1900) device_type = 'DESKTOP';

  // 4. Device Name
  let device_name = '';
  if (device_type === 'MOBILE') {
    device_name = /iphone/i.test(ua) ? 'Apple iPhone' : 'Android Smartphone';
  } else if (device_type === 'TABLET') {
    device_name = /ipad/i.test(ua) ? 'Apple iPad' : 'Android Tablet';
  } else if (/mac/i.test(operating_system)) {
    device_name = 'MacBook Laptop';
  } else {
    device_name = `${operating_system} Laptop`;
  }

  return {
    device_id,
    device_name,
    device_type,
    browser,
    operating_system,
  };
}
