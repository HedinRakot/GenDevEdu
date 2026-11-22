import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { FontSize, FontWeight } from '@/config/theme';

interface ProgressBarProps {
  /** Prozentwert 0–100 */
  progress: number;
  /** Optionale Höhe (Standard: 10) */
  height?: number;
  /** Farbe der Leiste */
  color?: string;
  /** Hintergrundfarbe */
  backgroundColor?: string;
  /** Zeigt Prozentanzeige an */
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  height = 10,
  color,
  backgroundColor,
  showLabel = false,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.primary;
  const trackColor = backgroundColor ?? colors.surfaceElevated;
  const clamped = Math.min(100, Math.max(0, progress));

  // #3: Füllbreite bei Fortschrittsänderung animieren (useNativeDriver:false, da Layout).
  const anim = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: clamped, duration: 400, useNativeDriver: false }).start();
  }, [clamped, anim]);
  const animatedWidth = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View>
      {showLabel && (
        <Text style={[styles.label, { color: fillColor }]}>{Math.round(clamped)}%</Text>
      )}
      <View
        style={[
          styles.track,
          { height, backgroundColor: trackColor, borderRadius: height / 2 },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth,
              backgroundColor: fillColor,
              borderRadius: height / 2,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0 },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
    textAlign: 'right',
  },
});
