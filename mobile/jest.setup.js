/**
 * Globale Mocks für Jest.
 * Wird über package.json -> jest.setupFiles eingebunden.
 */

// AsyncStorage Mock
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key, value) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
      multiGet: jest.fn((keys) =>
        Promise.resolve(keys.map((k) => [k, store.get(k) ?? null])),
      ),
      multiSet: jest.fn((entries) => {
        entries.forEach(([k, v]) => store.set(k, v));
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys) => {
        keys.forEach((k) => store.delete(k));
        return Promise.resolve();
      }),
    },
  };
});

// react-native-safe-area-context Mock: liefert Null-Insets + Passthrough-Komponenten,
// damit useSafeAreaInsets() ohne SafeAreaProvider im Test nicht wirft.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    __esModule: true,
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaInsetsContext: React.createContext(insets),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});

// expo-notifications Mock (nicht in Tests benötigt)
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notif_id_123')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { CALENDAR: 'calendar' },
}));

// react-native-markdown-display Mock (rendert nur den raw-text, reicht für Snapshots)
jest.mock('react-native-markdown-display', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }) => React.createElement(Text, null, children),
  };
});

// expo-secure-store Mock (verhält sich wie ein In-Memory-Store)
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    __esModule: true,
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __reset: () => store.clear(),
  };
});

// expo-auth-session Mock – Tests können promptAsync gezielt steuern
jest.mock('expo-auth-session', () => {
  return {
    __esModule: true,
    ResponseType: { Code: 'code' },
    useAuthRequest: jest.fn(() => [
      { codeVerifier: 'test-verifier' },
      null,
      jest.fn(() => Promise.resolve({ type: 'success', params: { code: 'auth-code' } })),
    ]),
    exchangeCodeAsync: jest.fn(() =>
      Promise.resolve({
        accessToken: 'access-1',
        idToken: 'id-1',
        refreshToken: 'refresh-1',
        expiresIn: 3600,
      }),
    ),
    fetchDiscoveryAsync: jest.fn(() => Promise.resolve({})),
    makeRedirectUri: jest.fn(() => 'educationapp://auth'),
  };
});

// expo-web-browser Mock (Logout-Flow)
jest.mock('expo-web-browser', () => ({
  __esModule: true,
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'success' })),
}));
