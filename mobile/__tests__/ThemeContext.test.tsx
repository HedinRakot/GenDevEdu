import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lightColors, darkColors } from '@/config/theme';
import { STORAGE_KEYS } from '@/store/storage';
import type { Palette } from '@/config/theme';
import { ThemeProvider, useTheme, useThemedStyles } from '@/context/ThemeContext';

// In the jest-expo test environment useColorScheme returns null (system = light).
// We test explicit modes via setMode without needing to mock the hook itself.

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('ThemeProvider – hydration from AsyncStorage', () => {
  it('loads stored "dark" and activates dark mode after hydration', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toEqual(darkColors);
  });

  it('loads stored "light" and activates light mode', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    expect(result.current.mode).toBe('light');
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toEqual(lightColors);
  });

  it('loads stored "system" and stays in system mode', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, 'system');
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    expect(result.current.mode).toBe('system');
  });

  it('ignores unknown stored values and defaults to system', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, 'banana');
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    expect(result.current.mode).toBe('system');
  });
});

describe('ThemeProvider – isDark logic', () => {
  it('isDark false in system mode when no dark scheme is detected', async () => {
    // useColorScheme returns null in jest-expo test environment
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    expect(result.current.mode).toBe('system');
    expect(result.current.isDark).toBe(false);
  });

  it('isDark true when mode is explicitly "dark"', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    await act(async () => { result.current.setMode('dark'); });
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toEqual(darkColors);
  });

  it('isDark false when mode is explicitly "light"', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    await act(async () => { result.current.setMode('light'); });
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toEqual(lightColors);
  });
});

describe('ThemeProvider – setMode', () => {
  it('changes mode and persists to AsyncStorage', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    await act(async () => { result.current.setMode('dark'); });
    await flush();
    expect(result.current.mode).toBe('dark');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
  });

  it('logs a warning when AsyncStorage.setItem rejects', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    await act(async () => { result.current.setMode('dark'); });
    await flush();
    expect(warnSpy).toHaveBeenCalledWith('[Theme] persist failed', expect.any(Error));
    warnSpy.mockRestore();
  });
});

describe('ThemeProvider – toggle', () => {
  it('toggles from light to dark', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    await act(async () => { result.current.setMode('light'); });
    await act(async () => { result.current.toggle(); });
    expect(result.current.isDark).toBe(true);
    expect(result.current.mode).toBe('dark');
  });

  it('toggles from dark to light', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await flush();
    await act(async () => { result.current.setMode('dark'); });
    await act(async () => { result.current.toggle(); });
    expect(result.current.isDark).toBe(false);
    expect(result.current.mode).toBe('light');
  });
});

describe('useTheme outside ThemeProvider', () => {
  it('throws a descriptive error', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within <ThemeProvider>',
    );
    errSpy.mockRestore();
  });
});

describe('useThemedStyles', () => {
  it('passes the current palette to the factory', async () => {
    const factory = jest.fn((c: Palette) => ({ bg: c.background }));
    const { result } = renderHook(() => useThemedStyles(factory), { wrapper });
    await flush();
    expect(factory).toHaveBeenCalledWith(lightColors);
    expect(result.current).toEqual({ bg: lightColors.background });
  });

  it('returns dark palette when dark mode is active', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    const factory = (c: Palette) => ({ bg: c.background });
    const { result } = renderHook(() => useThemedStyles(factory), { wrapper });
    await flush();
    expect(result.current).toEqual({ bg: darkColors.background });
  });
});
