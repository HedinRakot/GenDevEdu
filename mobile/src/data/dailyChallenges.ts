/**
 * Pool von täglichen Mini-Coding-Challenges. Eine deterministische
 * Auswahl pro Datum sorgt dafür, dass alle User am gleichen Tag dieselbe
 * Challenge sehen, ohne dass ein Server nötig ist.
 */

import type { Texte } from '@/types/course';

export interface DailyChallenge {
  id: string;
  title: Texte;
  description: Texte;
  /** Sprachunabhängiger Hinweis-Code, kann Sprachfeatures demonstrieren */
  exampleSnippet?: string;
  estimatedMinutes: number;
}

const t = (de: string, en: string, ru: string): Texte => ({
  items: [
    { text: de, language: 1 },
    { text: en, language: 2 },
    { text: ru, language: 0 },
  ],
});

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'fizzbuzz',
    title: t('FizzBuzz', 'FizzBuzz', 'FizzBuzz'),
    description: t(
      'Schreibe eine Funktion, die Zahlen 1–15 ausgibt, "Fizz" für 3er, "Buzz" für 5er.',
      'Write a function that prints 1–15, "Fizz" for multiples of 3, "Buzz" for 5.',
      'Напишите функцию, которая выводит числа 1–15, «Fizz» для кратных 3 и «Buzz» для 5.',
    ),
    exampleSnippet:
      "for (let i = 1; i <= 15; i++) {\n  let out = '';\n  if (i % 3 === 0) out += 'Fizz';\n  if (i % 5 === 0) out += 'Buzz';\n  console.log(out || i);\n}",
    estimatedMinutes: 5,
  },
  {
    id: 'reverse-string',
    title: t('String umkehren', 'Reverse a string', 'Перевернуть строку'),
    description: t(
      'Implementiere eine Funktion `reverse(s)`, die einen String in O(n) umkehrt.',
      'Implement a function `reverse(s)` that reverses a string in O(n).',
      'Реализуйте функцию `reverse(s)`, переворачивающую строку за O(n).',
    ),
    exampleSnippet: "const reverse = (s) => [...s].reverse().join('');",
    estimatedMinutes: 3,
  },
  {
    id: 'mongo-find',
    title: t('MongoDB find()', 'MongoDB find()', 'MongoDB find()'),
    description: t(
      'Schreibe einen find-Query, der alle User mit `age > 18` und `country = "DE"` liefert.',
      'Write a `find` query for all users with `age > 18` and `country = "DE"`.',
      'Напишите запрос find для пользователей с `age > 18` и `country = "DE"`.',
    ),
    exampleSnippet:
      "db.users.find({ age: { $gt: 18 }, country: 'DE' }).toArray();",
    estimatedMinutes: 5,
  },
  {
    id: 'debounce',
    title: t('Debounce-Funktion', 'Debounce function', 'Функция debounce'),
    description: t(
      'Implementiere `debounce(fn, ms)`, sodass `fn` erst nach `ms` Ruhe aufgerufen wird.',
      'Implement `debounce(fn, ms)` so `fn` only fires after `ms` of silence.',
      'Реализуйте `debounce(fn, ms)`, чтобы `fn` вызывалась только после `ms` тишины.',
    ),
    exampleSnippet:
      "const debounce = (fn, ms) => {\n  let id;\n  return (...args) => {\n    clearTimeout(id);\n    id = setTimeout(() => fn(...args), ms);\n  };\n};",
    estimatedMinutes: 8,
  },
  {
    id: 'palindrome',
    title: t('Palindrom', 'Palindrome', 'Палиндром'),
    description: t(
      'Prüfe, ob ein String ein Palindrom ist (Groß/Kleinschreibung ignorieren).',
      'Check whether a string is a palindrome (ignore case).',
      'Проверьте, является ли строка палиндромом (без учёта регистра).',
    ),
    exampleSnippet:
      "const isPalindrome = (s) => {\n  const x = s.toLowerCase();\n  return x === [...x].reverse().join('');\n};",
    estimatedMinutes: 4,
  },
  {
    id: 'sum-array',
    title: t('Array summieren', 'Sum an array', 'Сумма массива'),
    description: t(
      'Summiere alle Zahlen eines Arrays mit `reduce`.',
      'Sum all numbers in an array using `reduce`.',
      'Сложите все числа массива с помощью `reduce`.',
    ),
    exampleSnippet:
      'const sum = (arr) => arr.reduce((acc, n) => acc + n, 0);',
    estimatedMinutes: 3,
  },
  {
    id: 'mongo-update',
    title: t('MongoDB update()', 'MongoDB update()', 'MongoDB update()'),
    description: t(
      'Setze für alle inaktiven User das Feld `archived: true`.',
      'Set `archived: true` for all inactive users.',
      'Установите `archived: true` для всех неактивных пользователей.',
    ),
    exampleSnippet:
      "db.users.updateMany({ active: false }, { $set: { archived: true } });",
    estimatedMinutes: 5,
  },
];

/**
 * Wählt eine Challenge deterministisch basierend auf dem Datum.
 */
export function pickDailyChallenge(date: Date = new Date()): DailyChallenge {
  // Tagesnummer seit Unix Epoch
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  const idx = ((dayIndex % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}
