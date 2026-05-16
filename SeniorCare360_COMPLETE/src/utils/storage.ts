import { Platform } from 'react-native';

// Cross-platform storage: SecureStore on native, localStorage on web
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {}
  },
  deleteItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {}
  },
};

// Safe base64 decode that works in React Native (no atob)
export function decodeJwtPayload(token: string): any {
  try {
    const base64 = token.split('.')[1];
    // React Native compatible base64 decode
    const base64Padded = base64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64Padded.length % 4;
    const padded = pad ? base64Padded + '='.repeat(4 - pad) : base64Padded;
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
