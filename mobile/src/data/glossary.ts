import type { Texte } from '@/types/course';

export interface GlossaryEntry {
  id: string;
  term: string;
  /** Lokalisierte Definition */
  definition: Texte;
  /** Verwandte Schlüsselwörter (für Suche) */
  keywords?: string[];
  category: 'js' | 'ts' | 'rn' | 'mongo' | 'general';
}

const t = (de: string, en: string, ru: string): Texte => ({
  items: [
    { text: de, language: 1 },
    { text: en, language: 2 },
    { text: ru, language: 0 },
  ],
});

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'closure',
    term: 'Closure',
    category: 'js',
    keywords: ['scope', 'lexical', 'function'],
    definition: t(
      'Eine Funktion zusammen mit den Variablen aus ihrem Erstellungs-Scope. Erlaubt es, Zustand zwischen Aufrufen zu kapseln.',
      'A function together with the variables from its lexical scope. Lets you encapsulate state between calls.',
      'Функция вместе с переменными из её лексической области. Позволяет инкапсулировать состояние между вызовами.',
    ),
  },
  {
    id: 'promise',
    term: 'Promise',
    category: 'js',
    keywords: ['async', 'await', 'asynchronous'],
    definition: t(
      'Ein Objekt, das das Ergebnis einer asynchronen Operation repräsentiert (pending, fulfilled, rejected).',
      'An object representing the result of an asynchronous operation (pending, fulfilled, rejected).',
      'Объект, представляющий результат асинхронной операции (pending, fulfilled, rejected).',
    ),
  },
  {
    id: 'generic',
    term: 'Generic',
    category: 'ts',
    keywords: ['template', 'type parameter'],
    definition: t(
      'Wiederverwendbarer Typ-Parameter, der erlaubt, dieselbe Logik für verschiedene Typen zu verwenden.',
      'A reusable type parameter that lets the same logic work over multiple types.',
      'Переиспользуемый типовой параметр, позволяющий писать одну логику для разных типов.',
    ),
  },
  {
    id: 'interface',
    term: 'Interface',
    category: 'ts',
    keywords: ['type', 'shape'],
    definition: t(
      'Beschreibt die Form eines Objekts in TypeScript – ohne zur Laufzeit existierenden Code zu erzeugen.',
      'Describes the shape of an object in TypeScript – without producing runtime code.',
      'Описывает форму объекта в TypeScript – без создания runtime-кода.',
    ),
  },
  {
    id: 'hook',
    term: 'Hook',
    category: 'rn',
    keywords: ['useState', 'useEffect', 'react'],
    definition: t(
      'Funktion, die mit React-Features in funktionalen Komponenten interagiert (z. B. useState, useEffect).',
      'A function that lets you hook into React state and lifecycle from function components.',
      'Функция, позволяющая использовать состояние и жизненный цикл React в функциональных компонентах.',
    ),
  },
  {
    id: 'navigation',
    term: 'Stack Navigation',
    category: 'rn',
    keywords: ['react-navigation', 'screens', 'route'],
    definition: t(
      'Navigationsmuster, bei dem Screens auf einen Stack gepusht/gepoppt werden – wie ein Browser-Verlauf.',
      'A navigation pattern that pushes/pops screens onto a stack, similar to a browser history.',
      'Шаблон навигации с переходом между экранами через стек, похожий на историю браузера.',
    ),
  },
  {
    id: 'mongo-document',
    term: 'Document',
    category: 'mongo',
    keywords: ['bson', 'record', 'json'],
    definition: t(
      'Die Grundeinheit in MongoDB: eine BSON-strukturierte Aufzeichnung – analog zu einer JSON-Zeile.',
      'The fundamental unit in MongoDB: a BSON-structured record – analogous to a JSON object.',
      'Базовая единица MongoDB: запись в формате BSON – аналог JSON-объекта.',
    ),
  },
  {
    id: 'mongo-collection',
    term: 'Collection',
    category: 'mongo',
    keywords: ['table', 'group'],
    definition: t(
      'Gruppe von Dokumenten in MongoDB – grob vergleichbar mit einer Tabelle in SQL-Datenbanken.',
      'A group of documents in MongoDB – roughly comparable to a SQL table.',
      'Группа документов в MongoDB – примерный аналог таблицы в SQL.',
    ),
  },
  {
    id: 'mongo-aggregation',
    term: 'Aggregation Pipeline',
    category: 'mongo',
    keywords: ['$match', '$group', 'pipeline'],
    definition: t(
      'Mehrstufige Datenverarbeitung in MongoDB, bei der Stages wie $match, $group, $project verkettet werden.',
      'Multi-stage data processing in MongoDB, chaining stages like $match, $group, $project.',
      'Многостадийная обработка данных в MongoDB через стадии $match, $group, $project и др.',
    ),
  },
  {
    id: 'rest',
    term: 'REST',
    category: 'general',
    keywords: ['api', 'http', 'endpoint'],
    definition: t(
      'Architekturstil für HTTP-APIs: Ressourcen werden über URLs adressiert und mit GET/POST/PUT/DELETE manipuliert.',
      'An HTTP API style: resources are addressed by URL and manipulated via GET/POST/PUT/DELETE.',
      'Стиль HTTP API: ресурсы адресуются через URL и обрабатываются через GET/POST/PUT/DELETE.',
    ),
  },
  {
    id: 'jwt',
    term: 'JWT',
    category: 'general',
    keywords: ['token', 'auth', 'jsonwebtoken'],
    definition: t(
      'JSON Web Token: kompakter, signierter Token, der Claims über einen User transportieren kann.',
      'JSON Web Token: a compact, signed token that can carry claims about a user.',
      'JSON Web Token: компактный подписанный токен, передающий claims о пользователе.',
    ),
  },
];

/** Filtert das Glossar nach einem Suchbegriff (case-insensitive). */
export function filterGlossary(query: string, list: GlossaryEntry[] = GLOSSARY): GlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((entry) => {
    if (entry.term.toLowerCase().includes(q)) return true;
    if (entry.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
    return entry.definition.items.some((item) => item.text.toLowerCase().includes(q));
  });
}
