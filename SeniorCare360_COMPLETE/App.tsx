import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { storage, decodeJwtPayload } from './src/utils/storage';
import { loginSuccess, setProfile } from './src/store';
import { userService } from './src/services/api';
import { Colors } from './src/theme';

async function tryAutoLogin() {
  try {
    const token = await storage.getItem('access_token');
    if (!token) return;

    // Safe JWT decode — works in React Native (no atob needed)
    const payload = decodeJwtPayload(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      await storage.deleteItem('access_token');
      return;
    }

    const profile = await userService.getProfile();
    store.dispatch(loginSuccess({
      userId: profile.id,
      firstName: profile.first_name,
      token,
    }));
    store.dispatch(setProfile(profile));
  } catch {
    await storage.deleteItem('access_token');
  }
}

function AppContent() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    tryAutoLogin().finally(() => setInitializing(false));
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
