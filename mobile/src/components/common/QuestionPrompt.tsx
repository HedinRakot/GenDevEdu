import React from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { htmlToMarkdown } from '@/utils/htmlToMarkdown';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  /** Roher Fragetext (kann Legacy-HTML aus dem importierten Kurs enthalten). */
  text: string;
  /** Styling für den reinen Text-Pfad (Klartext-Fragen). */
  textStyle?: StyleProp<TextStyle>;
  /** Styling des Containers für den Markdown-Pfad (z. B. um Abstände zu erhalten). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Rendert einen Fragetext. Enthält er HTML/Entities (Rich-Text aus der
 * WebSitesDesignerTool-Quelle), wird es via {@link htmlToMarkdown} zu Markdown
 * konvertiert und formatiert dargestellt – analog zu den Lektionstexten.
 * Reiner Klartext behält das einfache, hervorgehobene Text-Styling.
 */
export function QuestionPrompt({ text, textStyle, containerStyle }: Props) {
  if (/[<&]/.test(text)) {
    return (
      <View style={containerStyle}>
        <MarkdownRenderer content={htmlToMarkdown(text)} />
      </View>
    );
  }
  return <Text style={textStyle}>{text}</Text>;
}
