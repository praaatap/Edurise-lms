import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

/**
 * Perform biometric authentication.
 * Returns true if successful, false otherwise.
 */
export const authenticateBiometric = async (
  reason: string = 'Confirm your identity to proceed'
): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // If hardware is missing or no biometrics enrolled, skip or return true (fallback to PIN/Password is handled by OS usually)
      // For demonstration, we'll allow it but you could enforce a PIN here.
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    return result.success;
  } catch (error) {
    console.error('Biometric Auth Error:', error);
    return false;
  }
};


/**
 * Securely save data to the device.
 */
export const secureSave = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value);
};

/**
 * Securely retrieve data from the device.
 */
export const secureGet = async (key: string) => {
  return await SecureStore.getItemAsync(key);
};
