/**
 * EduCode – Root App
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { useFonts } from 'expo-font';
import {
  SourceSerif4_400Regular,
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

import '@/i18n';
import i18n from '@/i18n';
import { FontFamily } from '@/config/theme';

import { CLERK_PUBLISHABLE_KEY } from '@/config/env';
import { getSavedLanguage } from '@/store/storage';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryProvider';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { scheduleDailyStreakReminder, isStreakReminderEnabled } from '@/services/notifications';

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
};

// Globaler Font-Default: setzt Instrument Sans app-weit, ohne alle Screens
// anzufassen. Headlines opten später via <Typography variant="…"> auf Serif,
// Code via Mono. Muss vor dem ersten Render laufen.
const TextWithDefaults = Text as unknown as { defaultProps?: { style?: unknown } };
TextWithDefaults.defaultProps = TextWithDefaults.defaultProps ?? {};
TextWithDefaults.defaultProps.style = [
  TextWithDefaults.defaultProps.style,
  { fontFamily: FontFamily.sans },
];

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    SourceSerif4_400Regular,
    SourceSerif4_600SemiBold,
    SourceSerif4_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    async function prepare() {
      try {
        const lang = await getSavedLanguage();
        if (lang) {
          await i18n.changeLanguage(lang);
        }
        if (await isStreakReminderEnabled()) {
          scheduleDailyStreakReminder().catch((e) => console.warn('[App] reminder', e));
        }
      } catch (e) {
        console.warn('Bootstrap error:', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <ThemedStatusBar />
                <RootNavigator />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
