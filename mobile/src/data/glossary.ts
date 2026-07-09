import type { Texte } from '@/types/course';

export interface GlossaryEntry {
  id: string;
  term: string;
  /** Lokalisierte Definition */
  definition: Texte;
  /** Verwandte Schlüsselwörter (für Suche) */
  keywords?: string[];
  category: 'csharp' | 'oop' | 'dotnet' | 'tooling' | 'general';
}

const t = (de: string, en: string, ru: string): Texte => ({
  items: [
    { text: de, language: 1 },
    { text: en, language: 2 },
    { text: ru, language: 0 },
  ],
});

/**
 * Anfängergerechtes Glossar, inhaltlich am C#/.NET-Kurs ausgerichtet
 * (Typen, Variablen, Bedingungen, Schleifen, Methoden, Klassen, Vererbung,
 * Interfaces, Enums, Fehlerbehandlung, LINQ, Tooling).
 */
export const GLOSSARY: GlossaryEntry[] = [
  // ── C#-Sprachgrundlagen ─────────────────────────────────────────────────
  {
    id: 'variable',
    term: 'Variable',
    category: 'csharp',
    keywords: ['deklaration', 'zuweisung', 'wert'],
    definition: t(
      'Ein benannter Speicherplatz für einen Wert, z. B. `int alter = 30;`. Der Wert kann sich später ändern.',
      'A named storage location for a value, e.g. `int age = 30;`. The value can change later.',
      'Именованная ячейка памяти для значения, например `int age = 30;`. Значение может меняться.',
    ),
  },
  {
    id: 'datentyp',
    term: 'Datentyp',
    category: 'csharp',
    keywords: ['int', 'double', 'bool', 'string', 'type'],
    definition: t(
      'Legt fest, welche Art von Wert eine Variable speichert: `int` (Ganzzahl), `double` (Kommazahl), `bool` (wahr/falsch), `string` (Text).',
      'Defines what kind of value a variable stores: `int` (whole number), `double` (decimal), `bool` (true/false), `string` (text).',
      'Определяет, какое значение хранит переменная: `int` (целое), `double` (дробное), `bool` (истина/ложь), `string` (текст).',
    ),
  },
  {
    id: 'var-keyword',
    term: 'var',
    category: 'csharp',
    keywords: ['typinferenz', 'inference', 'implizit'],
    definition: t(
      'Lässt den Compiler den Datentyp selbst herleiten: `var name = "Ada";` ergibt einen `string`. Der Typ steht trotzdem zur Compile-Zeit fest.',
      'Lets the compiler infer the type: `var name = "Ada";` becomes a `string`. The type is still fixed at compile time.',
      'Компилятор сам выводит тип: `var name = "Ada";` становится `string`. Тип фиксируется при компиляции.',
    ),
  },
  {
    id: 'string',
    term: 'string',
    category: 'csharp',
    keywords: ['text', 'zeichenkette', 'immutable'],
    definition: t(
      'Eine Zeichenkette (Text). Strings sind in C# unveränderlich (immutable) — Methoden wie `ToUpper()` liefern einen neuen String.',
      'A sequence of characters (text). Strings in C# are immutable — methods like `ToUpper()` return a new string.',
      'Строка (текст). В C# строки неизменяемы — методы вроде `ToUpper()` возвращают новую строку.',
    ),
  },
  {
    id: 'string-interpolation',
    term: 'String-Interpolation',
    category: 'csharp',
    keywords: ['$', 'format', 'platzhalter'],
    definition: t(
      'Baut Werte direkt in einen String ein: `$"Hallo {name}, du bist {alter}!"` — lesbarer als Verkettung mit `+`.',
      'Embeds values directly into a string: `$"Hello {name}, you are {age}!"` — more readable than concatenation with `+`.',
      'Встраивает значения прямо в строку: `$"Привет, {name}!"` — читабельнее, чем конкатенация через `+`.',
    ),
  },
  {
    id: 'bedingung',
    term: 'if / else',
    category: 'csharp',
    keywords: ['bedingung', 'verzweigung', 'condition'],
    definition: t(
      'Führt Code nur aus, wenn eine Bedingung wahr ist: `if (alter >= 18) { … } else { … }`.',
      'Runs code only when a condition is true: `if (age >= 18) { … } else { … }`.',
      'Выполняет код только при истинном условии: `if (age >= 18) { … } else { … }`.',
    ),
  },
  {
    id: 'switch',
    term: 'switch',
    category: 'csharp',
    keywords: ['case', 'verzweigung', 'pattern matching'],
    definition: t(
      'Verzweigung mit mehreren Fällen für einen Wert — übersichtlicher als viele `else if`. Moderne C#-Versionen bieten auch `switch`-Ausdrücke.',
      'Multi-branch selection on one value — cleaner than many `else if`. Modern C# also offers `switch` expressions.',
      'Ветвление по нескольким вариантам значения — нагляднее множества `else if`. Современный C# поддерживает switch-выражения.',
    ),
  },
  {
    id: 'for-schleife',
    term: 'for-Schleife',
    category: 'csharp',
    keywords: ['loop', 'iteration', 'zähler'],
    definition: t(
      'Wiederholt Code mit einem Zähler: `for (int i = 0; i < 10; i++) { … }` läuft zehnmal.',
      'Repeats code using a counter: `for (int i = 0; i < 10; i++) { … }` runs ten times.',
      'Повторяет код со счётчиком: `for (int i = 0; i < 10; i++) { … }` выполняется десять раз.',
    ),
  },
  {
    id: 'while-schleife',
    term: 'while-Schleife',
    category: 'csharp',
    keywords: ['loop', 'bedingung', 'endlosschleife'],
    definition: t(
      'Wiederholt Code, solange eine Bedingung wahr ist. Vorsicht: Ohne Abbruchbedingung entsteht eine Endlosschleife.',
      'Repeats code while a condition stays true. Careful: without an exit condition you get an infinite loop.',
      'Повторяет код, пока условие истинно. Осторожно: без условия выхода получится бесконечный цикл.',
    ),
  },
  {
    id: 'foreach',
    term: 'foreach',
    category: 'csharp',
    keywords: ['loop', 'collection', 'iteration'],
    definition: t(
      'Durchläuft alle Elemente einer Sammlung: `foreach (var name in namen) { … }` — ohne Index-Verwaltung.',
      'Iterates over every element of a collection: `foreach (var name in names) { … }` — no index bookkeeping.',
      'Перебирает все элементы коллекции: `foreach (var name in names) { … }` — без работы с индексами.',
    ),
  },
  {
    id: 'methode',
    term: 'Methode',
    category: 'csharp',
    keywords: ['funktion', 'function', 'aufruf'],
    definition: t(
      'Ein benannter, wiederverwendbarer Codeblock: `int Verdopple(int x) => x * 2;`. Methoden gliedern Programme in kleine Einheiten.',
      'A named, reusable block of code: `int Double(int x) => x * 2;`. Methods split programs into small units.',
      'Именованный переиспользуемый блок кода: `int Double(int x) => x * 2;`. Методы делят программу на небольшие части.',
    ),
  },
  {
    id: 'parameter',
    term: 'Parameter & Argument',
    category: 'csharp',
    keywords: ['übergabe', 'argument', 'input'],
    definition: t(
      'Parameter sind die Platzhalter in der Methodendefinition, Argumente die konkreten Werte beim Aufruf: `Gruss("Ada")`.',
      'Parameters are the placeholders in a method definition; arguments are the actual values passed on call: `Greet("Ada")`.',
      'Параметры — это заполнители в объявлении метода, аргументы — конкретные значения при вызове: `Greet("Ada")`.',
    ),
  },
  {
    id: 'rueckgabewert',
    term: 'Rückgabewert (return)',
    category: 'csharp',
    keywords: ['return', 'void', 'ergebnis'],
    definition: t(
      '`return` beendet eine Methode und liefert das Ergebnis an den Aufrufer. `void` bedeutet: kein Rückgabewert.',
      '`return` ends a method and hands the result back to the caller. `void` means: no return value.',
      '`return` завершает метод и возвращает результат вызывающему коду. `void` — метод ничего не возвращает.',
    ),
  },
  {
    id: 'array',
    term: 'Array',
    category: 'csharp',
    keywords: ['feld', 'index', 'sammlung'],
    definition: t(
      'Sammlung fester Größe mit Zugriff per Index (ab 0): `int[] zahlen = { 1, 2, 3 };` → `zahlen[0]` ist 1.',
      'A fixed-size collection accessed by index (starting at 0): `int[] numbers = { 1, 2, 3 };` → `numbers[0]` is 1.',
      'Коллекция фиксированного размера с доступом по индексу (с 0): `int[] numbers = { 1, 2, 3 };` → `numbers[0]` равно 1.',
    ),
  },
  {
    id: 'list',
    term: 'List<T>',
    category: 'csharp',
    keywords: ['collection', 'add', 'remove', 'generisch'],
    definition: t(
      'Dynamische Liste, die wachsen und schrumpfen kann: `var namen = new List<string>(); namen.Add("Ada");`.',
      'A dynamic list that can grow and shrink: `var names = new List<string>(); names.Add("Ada");`.',
      'Динамический список, который может расти и уменьшаться: `var names = new List<string>(); names.Add("Ada");`.',
    ),
  },
  {
    id: 'dictionary',
    term: 'Dictionary<TKey, TValue>',
    category: 'csharp',
    keywords: ['map', 'schlüssel', 'key value'],
    definition: t(
      'Speichert Schlüssel-Wert-Paare für schnellen Zugriff per Schlüssel: `alter["Ada"] = 36;`.',
      'Stores key-value pairs for fast lookup by key: `ages["Ada"] = 36;`.',
      'Хранит пары ключ-значение с быстрым доступом по ключу: `ages["Ada"] = 36;`.',
    ),
  },
  {
    id: 'enum',
    term: 'Enum',
    category: 'csharp',
    keywords: ['aufzählung', 'konstanten', 'werte'],
    definition: t(
      'Aufzählungstyp mit festen benannten Werten: `enum Wochentag { Montag, Dienstag, … }` — lesbarer als magische Zahlen.',
      'An enumeration of fixed named values: `enum Weekday { Monday, Tuesday, … }` — more readable than magic numbers.',
      'Перечисление с фиксированными именованными значениями: `enum Weekday { Monday, … }` — читабельнее «магических чисел».',
    ),
  },
  {
    id: 'null',
    term: 'null & Nullable',
    category: 'csharp',
    keywords: ['nullreference', '?', 'nothing'],
    definition: t(
      '`null` bedeutet „kein Wert“. `string?` erlaubt null explizit; der Zugriff auf null-Werte löst eine `NullReferenceException` aus.',
      '`null` means “no value”. `string?` allows null explicitly; accessing a null value throws a `NullReferenceException`.',
      '`null` означает «нет значения». `string?` явно допускает null; обращение к null вызывает `NullReferenceException`.',
    ),
  },
  {
    id: 'exception',
    term: 'Exception',
    category: 'csharp',
    keywords: ['fehler', 'error', 'throw'],
    definition: t(
      'Ein Laufzeitfehler-Objekt, das den normalen Programmfluss unterbricht — z. B. beim Teilen durch 0 oder ungültiger Eingabe.',
      'A runtime error object that interrupts normal program flow — e.g. dividing by zero or invalid input.',
      'Объект ошибки времени выполнения, прерывающий нормальный ход программы — например, деление на ноль.',
    ),
  },
  {
    id: 'try-catch',
    term: 'try / catch / finally',
    category: 'csharp',
    keywords: ['fehlerbehandlung', 'exception', 'abfangen'],
    definition: t(
      'Fängt Fehler kontrolliert ab: Im `try` steht der riskante Code, `catch` behandelt den Fehler, `finally` läuft immer (z. B. zum Aufräumen).',
      'Handles errors in a controlled way: risky code goes in `try`, `catch` handles the error, `finally` always runs (e.g. cleanup).',
      'Контролируемая обработка ошибок: рискованный код в `try`, обработка в `catch`, `finally` выполняется всегда.',
    ),
  },
  {
    id: 'cast',
    term: 'Typumwandlung (Cast)',
    category: 'csharp',
    keywords: ['convert', 'parse', 'konvertierung'],
    definition: t(
      'Wandelt einen Wert in einen anderen Typ um: implizit (`int` → `double`), per Cast (`(int)3.7`) oder per Methode (`int.Parse("42")`).',
      'Converts a value to another type: implicitly (`int` → `double`), by cast (`(int)3.7`) or by method (`int.Parse("42")`).',
      'Преобразует значение в другой тип: неявно (`int` → `double`), через каст (`(int)3.7`) или метод (`int.Parse("42")`).',
    ),
  },
  {
    id: 'const',
    term: 'const & readonly',
    category: 'csharp',
    keywords: ['konstante', 'unveränderlich'],
    definition: t(
      '`const` ist eine Konstante zur Compile-Zeit (`const double Pi = 3.14;`), `readonly` wird einmalig im Konstruktor gesetzt.',
      '`const` is a compile-time constant (`const double Pi = 3.14;`); `readonly` is assigned once in the constructor.',
      '`const` — константа времени компиляции (`const double Pi = 3.14;`), `readonly` задаётся один раз в конструкторе.',
    ),
  },
  {
    id: 'scope',
    term: 'Gültigkeitsbereich (Scope)',
    category: 'csharp',
    keywords: ['sichtbarkeit', 'block', 'lokal'],
    definition: t(
      'Der Bereich, in dem eine Variable sichtbar ist — meist der Block `{ … }`, in dem sie deklariert wurde.',
      'The region where a variable is visible — usually the block `{ … }` it was declared in.',
      'Область, где переменная видима — обычно блок `{ … }`, в котором она объявлена.',
    ),
  },
  {
    id: 'operator',
    term: 'Operatoren',
    category: 'csharp',
    keywords: ['==', '&&', '||', 'vergleich'],
    definition: t(
      'Zeichen für Berechnungen und Vergleiche: `+ - * / %` (Rechnen), `== != < >` (Vergleich), `&& || !` (Logik).',
      'Symbols for calculations and comparisons: `+ - * / %` (math), `== != < >` (comparison), `&& || !` (logic).',
      'Символы для вычислений и сравнений: `+ - * / %` (математика), `== != < >` (сравнение), `&& || !` (логика).',
    ),
  },

  // ── OOP ─────────────────────────────────────────────────────────────────
  {
    id: 'klasse',
    term: 'Klasse',
    category: 'oop',
    keywords: ['class', 'bauplan', 'objekt'],
    definition: t(
      'Ein Bauplan für Objekte: bündelt Daten (Felder/Properties) und Verhalten (Methoden), z. B. `class Auto { … }`.',
      'A blueprint for objects: bundles data (fields/properties) and behavior (methods), e.g. `class Car { … }`.',
      'Чертёж для объектов: объединяет данные (поля/свойства) и поведение (методы), например `class Car { … }`.',
    ),
  },
  {
    id: 'objekt',
    term: 'Objekt & Instanz',
    category: 'oop',
    keywords: ['new', 'instanz', 'instance'],
    definition: t(
      'Ein konkretes Exemplar einer Klasse, erzeugt mit `new`: `var auto = new Auto();`. Jede Instanz hat eigene Daten.',
      'A concrete instance of a class, created with `new`: `var car = new Car();`. Each instance holds its own data.',
      'Конкретный экземпляр класса, созданный через `new`: `var car = new Car();`. У каждого экземпляра свои данные.',
    ),
  },
  {
    id: 'konstruktor',
    term: 'Konstruktor',
    category: 'oop',
    keywords: ['constructor', 'new', 'initialisierung'],
    definition: t(
      'Spezielle Methode, die beim Erzeugen eines Objekts läuft und es initialisiert: `public Auto(string marke) { … }`.',
      'A special method that runs when an object is created and initializes it: `public Car(string brand) { … }`.',
      'Специальный метод, выполняющийся при создании объекта и инициализирующий его: `public Car(string brand) { … }`.',
    ),
  },
  {
    id: 'property',
    term: 'Property',
    category: 'oop',
    keywords: ['get', 'set', 'eigenschaft'],
    definition: t(
      'Kontrollierter Zugriff auf Daten einer Klasse: `public string Name { get; set; }` — außen wie ein Feld, innen mit Logik erweiterbar.',
      'Controlled access to class data: `public string Name { get; set; }` — looks like a field outside, can add logic inside.',
      'Контролируемый доступ к данным класса: `public string Name { get; set; }` — снаружи как поле, внутри можно добавить логику.',
    ),
  },
  {
    id: 'vererbung',
    term: 'Vererbung',
    category: 'oop',
    keywords: ['inheritance', 'basisklasse', 'ableitung'],
    definition: t(
      'Eine Klasse übernimmt Eigenschaften und Methoden einer Basisklasse: `class Elektroauto : Auto { … }` — vermeidet Duplikate.',
      'A class takes over members of a base class: `class ElectricCar : Car { … }` — avoids duplication.',
      'Класс наследует члены базового класса: `class ElectricCar : Car { … }` — избегает дублирования.',
    ),
  },
  {
    id: 'interface-cs',
    term: 'Interface',
    category: 'oop',
    keywords: ['vertrag', 'contract', 'implementieren'],
    definition: t(
      'Ein Vertrag, der Methoden/Properties vorschreibt, ohne sie zu implementieren: `interface IFahrbar { void Fahre(); }`. Klassen implementieren ihn.',
      'A contract that declares members without implementing them: `interface IDrivable { void Drive(); }`. Classes implement it.',
      'Контракт, объявляющий члены без реализации: `interface IDrivable { void Drive(); }`. Классы его реализуют.',
    ),
  },
  {
    id: 'polymorphie',
    term: 'Polymorphie',
    category: 'oop',
    keywords: ['virtual', 'override', 'vielgestaltigkeit'],
    definition: t(
      'Derselbe Methodenaufruf verhält sich je nach konkretem Typ unterschiedlich — via `virtual`/`override` oder Interfaces.',
      'The same method call behaves differently depending on the concrete type — via `virtual`/`override` or interfaces.',
      'Один и тот же вызов метода ведёт себя по-разному в зависимости от типа — через `virtual`/`override` или интерфейсы.',
    ),
  },
  {
    id: 'kapselung',
    term: 'Kapselung',
    category: 'oop',
    keywords: ['private', 'public', 'encapsulation'],
    definition: t(
      'Interne Details verbergen und nur eine kontrollierte Schnittstelle anbieten — über `private`, `public`, `protected`.',
      'Hiding internal details and exposing only a controlled interface — via `private`, `public`, `protected`.',
      'Скрытие внутренних деталей и предоставление контролируемого интерфейса — через `private`, `public`, `protected`.',
    ),
  },
  {
    id: 'static',
    term: 'static',
    category: 'oop',
    keywords: ['klassenmember', 'ohne instanz'],
    definition: t(
      'Gehört zur Klasse statt zur Instanz: `Math.Max(3, 7)` funktioniert ohne `new Math()`.',
      'Belongs to the class instead of an instance: `Math.Max(3, 7)` works without `new Math()`.',
      'Принадлежит классу, а не экземпляру: `Math.Max(3, 7)` работает без `new Math()`.',
    ),
  },
  {
    id: 'abstract',
    term: 'Abstrakte Klasse',
    category: 'oop',
    keywords: ['abstract', 'basisklasse', 'vorlage'],
    definition: t(
      'Eine Basisklasse, von der man keine Instanzen erzeugen kann. Sie kann fertige UND abstrakte (zu überschreibende) Methoden enthalten.',
      'A base class you cannot instantiate. It can contain implemented AND abstract (must-override) methods.',
      'Базовый класс, экземпляры которого нельзя создать. Может содержать готовые И абстрактные (обязательные к переопределению) методы.',
    ),
  },

  // ── .NET-Plattform ──────────────────────────────────────────────────────
  {
    id: 'dotnet',
    term: '.NET',
    category: 'dotnet',
    keywords: ['plattform', 'framework', 'runtime'],
    definition: t(
      'Microsofts Entwicklungsplattform für C# (und weitere Sprachen): Laufzeitumgebung, Klassenbibliothek und Tools — plattformübergreifend.',
      'Microsoft’s development platform for C# (and other languages): runtime, class library and tooling — cross-platform.',
      'Платформа разработки Microsoft для C# и других языков: среда выполнения, библиотека классов и инструменты.',
    ),
  },
  {
    id: 'clr',
    term: 'Runtime (CLR)',
    category: 'dotnet',
    keywords: ['common language runtime', 'il', 'jit'],
    definition: t(
      'Die Laufzeitumgebung von .NET: führt kompilierten Zwischencode (IL) aus, verwaltet Speicher und Sicherheit.',
      'The .NET runtime: executes compiled intermediate code (IL), manages memory and safety.',
      'Среда выполнения .NET: исполняет промежуточный код (IL), управляет памятью и безопасностью.',
    ),
  },
  {
    id: 'namespace',
    term: 'Namespace & using',
    category: 'dotnet',
    keywords: ['using', 'organisation', 'import'],
    definition: t(
      'Namespaces gruppieren Klassen (z. B. `System.Text`); `using System;` macht sie ohne vollen Pfad nutzbar.',
      'Namespaces group classes (e.g. `System.Text`); `using System;` lets you use them without the full path.',
      'Пространства имён группируют классы (например `System.Text`); `using System;` позволяет использовать их без полного пути.',
    ),
  },
  {
    id: 'nuget',
    term: 'NuGet',
    category: 'dotnet',
    keywords: ['paket', 'package', 'bibliothek'],
    definition: t(
      'Der Paketmanager von .NET: installiert fertige Bibliotheken ins Projekt, z. B. `dotnet add package Newtonsoft.Json`.',
      'The .NET package manager: installs ready-made libraries into your project, e.g. `dotnet add package Newtonsoft.Json`.',
      'Менеджер пакетов .NET: устанавливает готовые библиотеки в проект, например `dotnet add package Newtonsoft.Json`.',
    ),
  },
  {
    id: 'console',
    term: 'Console',
    category: 'dotnet',
    keywords: ['writeline', 'readline', 'ausgabe', 'eingabe'],
    definition: t(
      'Klasse für Ein-/Ausgabe im Terminal: `Console.WriteLine("Hallo");` schreibt, `Console.ReadLine()` liest eine Zeile.',
      'Class for terminal input/output: `Console.WriteLine("Hello");` writes, `Console.ReadLine()` reads a line.',
      'Класс для ввода/вывода в терминале: `Console.WriteLine("Привет");` пишет, `Console.ReadLine()` читает строку.',
    ),
  },
  {
    id: 'linq',
    term: 'LINQ',
    category: 'dotnet',
    keywords: ['where', 'select', 'abfrage', 'query'],
    definition: t(
      'Language Integrated Query: Sammlungen abfragen wie eine Datenbank — `zahlen.Where(x => x > 5).Select(x => x * 2)`.',
      'Language Integrated Query: query collections like a database — `numbers.Where(x => x > 5).Select(x => x * 2)`.',
      'Language Integrated Query: запросы к коллекциям как к базе данных — `numbers.Where(x => x > 5).Select(x => x * 2)`.',
    ),
  },
  {
    id: 'lambda',
    term: 'Lambda-Ausdruck',
    category: 'dotnet',
    keywords: ['=>', 'anonym', 'func'],
    definition: t(
      'Kurzform für eine anonyme Funktion: `x => x * 2` — häufig als Argument für LINQ-Methoden wie `Where` und `Select`.',
      'Short form of an anonymous function: `x => x * 2` — commonly passed to LINQ methods like `Where` and `Select`.',
      'Краткая форма анонимной функции: `x => x * 2` — часто передаётся в LINQ-методы `Where` и `Select`.',
    ),
  },
  {
    id: 'async-await',
    term: 'async / await',
    category: 'dotnet',
    keywords: ['task', 'asynchron', 'nebenläufig'],
    definition: t(
      'Asynchrone Methoden blockieren das Programm nicht: `await` wartet auf ein `Task`-Ergebnis, während anderes weiterläuft.',
      'Asynchronous methods don’t block the program: `await` waits for a `Task` result while other work continues.',
      'Асинхронные методы не блокируют программу: `await` ждёт результат `Task`, пока выполняется другая работа.',
    ),
  },
  {
    id: 'gc',
    term: 'Garbage Collector',
    category: 'dotnet',
    keywords: ['speicher', 'memory', 'aufräumen'],
    definition: t(
      'Räumt automatisch Speicher von Objekten auf, die nicht mehr erreichbar sind — manuelles Freigeben entfällt.',
      'Automatically reclaims memory of objects that are no longer reachable — no manual freeing needed.',
      'Автоматически освобождает память недостижимых объектов — ручное освобождение не требуется.',
    ),
  },
  {
    id: 'solution-projekt',
    term: 'Solution & Projekt',
    category: 'dotnet',
    keywords: ['sln', 'csproj', 'struktur'],
    definition: t(
      'Ein Projekt (.csproj) bündelt Code zu einer App oder Bibliothek; eine Solution (.sln) fasst mehrere Projekte zusammen.',
      'A project (.csproj) bundles code into an app or library; a solution (.sln) groups multiple projects.',
      'Проект (.csproj) объединяет код в приложение или библиотеку; решение (.sln) группирует несколько проектов.',
    ),
  },

  // ── Tooling ─────────────────────────────────────────────────────────────
  {
    id: 'ide',
    term: 'IDE',
    category: 'tooling',
    keywords: ['visual studio', 'vs code', 'rider', 'editor'],
    definition: t(
      'Integrierte Entwicklungsumgebung: Editor, Compiler, Debugger und Tools in einem — z. B. Visual Studio, VS Code oder Rider.',
      'Integrated Development Environment: editor, compiler, debugger and tools in one — e.g. Visual Studio, VS Code or Rider.',
      'Интегрированная среда разработки: редактор, компилятор, отладчик и инструменты — например Visual Studio, VS Code, Rider.',
    ),
  },
  {
    id: 'compiler',
    term: 'Compiler & Build',
    category: 'tooling',
    keywords: ['dotnet build', 'übersetzen', 'il'],
    definition: t(
      'Der Compiler übersetzt C#-Quellcode in ausführbaren Code und meldet Fehler VOR dem Start: `dotnet build`.',
      'The compiler translates C# source code into executable code and reports errors BEFORE running: `dotnet build`.',
      'Компилятор переводит исходный код C# в исполняемый и сообщает об ошибках ДО запуска: `dotnet build`.',
    ),
  },
  {
    id: 'dotnet-cli',
    term: 'dotnet CLI',
    category: 'tooling',
    keywords: ['dotnet run', 'dotnet new', 'kommandozeile'],
    definition: t(
      'Kommandozeilen-Werkzeug für .NET: `dotnet new console` erstellt ein Projekt, `dotnet run` startet es, `dotnet test` testet.',
      'Command-line tool for .NET: `dotnet new console` creates a project, `dotnet run` starts it, `dotnet test` runs tests.',
      'Инструмент командной строки .NET: `dotnet new console` создаёт проект, `dotnet run` запускает, `dotnet test` тестирует.',
    ),
  },
  {
    id: 'debugger',
    term: 'Debugger & Breakpoint',
    category: 'tooling',
    keywords: ['haltepunkt', 'step', 'fehlersuche'],
    definition: t(
      'Der Debugger hält das Programm an Breakpoints an. Dann lassen sich Variablen inspizieren und Zeile für Zeile weiterlaufen.',
      'The debugger pauses the program at breakpoints. You can then inspect variables and step through line by line.',
      'Отладчик останавливает программу на брейкпоинтах. Затем можно смотреть переменные и идти по коду построчно.',
    ),
  },
  {
    id: 'unit-test',
    term: 'Unit-Test',
    category: 'tooling',
    keywords: ['xunit', 'assert', 'testen'],
    definition: t(
      'Automatischer Test einer kleinen Code-Einheit: prüft mit `Assert`, ob eine Methode das erwartete Ergebnis liefert (z. B. mit xUnit).',
      'An automated test of a small unit of code: uses `Assert` to check a method returns the expected result (e.g. with xUnit).',
      'Автоматический тест небольшого блока кода: через `Assert` проверяет ожидаемый результат метода (например, в xUnit).',
    ),
  },
  {
    id: 'git',
    term: 'Git & Repository',
    category: 'tooling',
    keywords: ['commit', 'branch', 'versionierung'],
    definition: t(
      'Versionsverwaltung: Ein Repository speichert die Historie des Codes; Commits sind Schnappschüsse, Branches parallele Stände.',
      'Version control: a repository stores the code’s history; commits are snapshots, branches are parallel lines of work.',
      'Система контроля версий: репозиторий хранит историю кода; коммиты — снимки, ветки — параллельные линии работы.',
    ),
  },

  // ── Allgemein ───────────────────────────────────────────────────────────
  {
    id: 'algorithmus',
    term: 'Algorithmus',
    category: 'general',
    keywords: ['schritte', 'lösung', 'verfahren'],
    definition: t(
      'Eine eindeutige Schritt-für-Schritt-Anleitung zur Lösung eines Problems — unabhängig von der Programmiersprache.',
      'An unambiguous step-by-step procedure for solving a problem — independent of any programming language.',
      'Однозначная пошаговая инструкция решения задачи — независимо от языка программирования.',
    ),
  },
  {
    id: 'syntax',
    term: 'Syntax',
    category: 'general',
    keywords: ['grammatik', 'regeln', 'schreibweise'],
    definition: t(
      'Die Grammatikregeln einer Programmiersprache. Syntaxfehler (z. B. fehlendes `;`) findet der Compiler sofort.',
      'The grammar rules of a programming language. Syntax errors (e.g. a missing `;`) are caught by the compiler immediately.',
      'Грамматические правила языка программирования. Синтаксические ошибки (например, пропущенная `;`) компилятор находит сразу.',
    ),
  },
  {
    id: 'bug',
    term: 'Bug & Debugging',
    category: 'general',
    keywords: ['fehler', 'fehlersuche'],
    definition: t(
      'Ein Bug ist ein Fehler im Programmverhalten; Debugging ist die systematische Suche nach seiner Ursache.',
      'A bug is a defect in program behavior; debugging is the systematic search for its cause.',
      'Баг — дефект в поведении программы; отладка — систематический поиск его причины.',
    ),
  },
  {
    id: 'refactoring',
    term: 'Refactoring',
    category: 'general',
    keywords: ['umbau', 'clean code', 'verbessern'],
    definition: t(
      'Code-Struktur verbessern, ohne das Verhalten zu ändern — z. B. Methoden extrahieren oder besser benennen.',
      'Improving code structure without changing behavior — e.g. extracting methods or renaming for clarity.',
      'Улучшение структуры кода без изменения поведения — например, выделение методов или переименование.',
    ),
  },
  {
    id: 'api',
    term: 'API',
    category: 'general',
    keywords: ['schnittstelle', 'rest', 'endpoint'],
    definition: t(
      'Programmierschnittstelle: definierte Funktionen/Endpunkte, über die Programme miteinander sprechen — z. B. eine REST-API über HTTP.',
      'Application Programming Interface: defined functions/endpoints programs use to talk to each other — e.g. a REST API over HTTP.',
      'Программный интерфейс: функции/эндпоинты, через которые программы общаются — например REST API по HTTP.',
    ),
  },
  {
    id: 'json',
    term: 'JSON',
    category: 'general',
    keywords: ['datenformat', 'serialisierung'],
    definition: t(
      'Leichtes Text-Datenformat für den Austausch strukturierter Daten: `{ "name": "Ada", "alter": 36 }`.',
      'A lightweight text data format for exchanging structured data: `{ "name": "Ada", "age": 36 }`.',
      'Лёгкий текстовый формат обмена структурированными данными: `{ "name": "Ada", "age": 36 }`.',
    ),
  },
  {
    id: 'datenbank',
    term: 'Datenbank',
    category: 'general',
    keywords: ['sql', 'mongodb', 'persistenz'],
    definition: t(
      'System zum dauerhaften Speichern und Abfragen von Daten — relational (SQL, Tabellen) oder dokumentbasiert (z. B. MongoDB).',
      'A system for persistently storing and querying data — relational (SQL, tables) or document-based (e.g. MongoDB).',
      'Система постоянного хранения и запросов данных — реляционная (SQL, таблицы) или документная (например, MongoDB).',
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
