/**
 * Device ID utility for event sourcing metadata.
 * Generates and persists a unique device identifier.
 */

const DEVICE_ID_KEY = 'devils-offline-device-id';

/**
 * Gets or creates a persistent device ID for this browser/device.
 * The ID is stored in localStorage and persists across sessions.
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
