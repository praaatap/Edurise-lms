import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  // Secure Storage for Tokens/Secrets
  async setSecure(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error('Error setting secure storage:', e);
    }
  },
  async getSecure(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error('Error getting secure storage:', e);
      return null;
    }
  },
  async removeSecure(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('Error removing secure storage:', e);
    }
  },

  // Async Storage for App Data
  async setItem(key: string, value: any) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error saving data:', e);
    }
  },
  async getItem(key: string) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data:', e);
      return null;
    }
  },
  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing data:', e);
    }
  }
};
