/**
 * Pool von täglichen Mini-Coding-Challenges, inhaltlich am C#/.NET-Kurs
 * ausgerichtet (Typen, Variablen, Bedingungen, Schleifen, Funktionen,
 * Klassen, Listen, Vererbung, Interfaces, Enums, Fehlerbehandlung, LINQ …).
 *
 * Die Auswahl erfolgt deterministisch pro Kalendertag: alle User sehen am
 * gleichen Tag dieselbe Challenge – ganz ohne Server. Statt eines simplen
 * Modulos wird pro "Zyklus" (Pool-Länge in Tagen) eine seed-basierte
 * Permutation erzeugt, sodass sich weder die Auswahl noch die Reihenfolge
 * trivial jede Woche wiederholt.
 */

import type { Texte } from '@/types/course';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/** Kategorie ~ Kurskapitel; dient Filterung/Statistik und Anzeige. */
export type ChallengeCategory =
  | 'types'
  | 'variables'
  | 'conditions'
  | 'loops'
  | 'functions'
  | 'classes'
  | 'lists'
  | 'inheritance'
  | 'interfaces'
  | 'enums'
  | 'errors'
  | 'debugging'
  | 'strings'
  | 'linq';

export interface DailyChallenge {
  id: string;
  title: Texte;
  description: Texte;
  /** Sprachunabhängiger Hinweis-/Beispiel-Code. */
  exampleSnippet?: string;
  /** Sprache für das Code-Highlighting-Label (Default: csharp). */
  snippetLang?: string;
  estimatedMinutes: number;
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
}

const t = (de: string, en: string, ru: string): Texte => ({
  items: [
    { text: de, language: 1 },
    { text: en, language: 2 },
    { text: ru, language: 0 },
  ],
});

export const DAILY_CHALLENGES: DailyChallenge[] = [
  // ── Typen ──────────────────────────────────────────────────────────────
  {
    id: 'cs-datentypen',
    category: 'types',
    difficulty: 'easy',
    estimatedMinutes: 4,
    title: t('Datentypen deklarieren', 'Declare data types', 'Объявление типов'),
    description: t(
      'Deklariere je eine Variable vom Typ `int`, `double`, `bool` und `string` und gib alle mit `Console.WriteLine` aus.',
      'Declare one variable each of type `int`, `double`, `bool` and `string` and print them all with `Console.WriteLine`.',
      'Объявите по одной переменной типа `int`, `double`, `bool` и `string` и выведите их через `Console.WriteLine`.',
    ),
    exampleSnippet:
      'int age = 30;\ndouble price = 9.99;\nbool isActive = true;\nstring name = "Ada";\nConsole.WriteLine($"{name} {age} {price} {isActive}");',
  },
  {
    id: 'cs-var-typinferenz',
    category: 'types',
    difficulty: 'easy',
    estimatedMinutes: 4,
    title: t('var & Typinferenz', 'var & type inference', 'var и вывод типов'),
    description: t(
      'Nutze `var`, damit der Compiler den Typ selbst ableitet. Erkläre in einem Kommentar, welcher Typ jeweils entsteht.',
      'Use `var` so the compiler infers the type. In a comment, note which type each variable gets.',
      'Используйте `var`, чтобы компилятор сам вывел тип. В комментарии укажите получившийся тип.',
    ),
    exampleSnippet:
      'var count = 42;        // int\nvar ratio = 3.14;      // double\nvar label = "Kurs";    // string',
  },

  // ── Variablen ──────────────────────────────────────────────────────────
  {
    id: 'cs-swap',
    category: 'variables',
    difficulty: 'easy',
    estimatedMinutes: 4,
    title: t('Werte tauschen', 'Swap two values', 'Обмен значений'),
    description: t(
      'Tausche die Werte zweier `int`-Variablen – zuerst mit Hilfsvariable, dann per Tupel-Zuweisung.',
      'Swap the values of two `int` variables – first with a temp variable, then via tuple assignment.',
      'Поменяйте местами значения двух `int`-переменных: сначала через временную переменную, затем через кортеж.',
    ),
    exampleSnippet: 'int a = 1, b = 2;\n(a, b) = (b, a);\nConsole.WriteLine($"{a} {b}"); // 2 1',
  },
  {
    id: 'cs-string-interpolation',
    category: 'variables',
    difficulty: 'easy',
    estimatedMinutes: 3,
    title: t('String-Interpolation', 'String interpolation', 'Интерполяция строк'),
    description: t(
      'Baue aus Vorname, Nachname und Alter einen Begrüßungssatz mit `$"..."`.',
      'Build a greeting sentence from first name, last name and age using `$"..."`.',
      'Составьте приветствие из имени, фамилии и возраста с помощью `$"..."`.',
    ),
    exampleSnippet:
      'string first = "Grace", last = "Hopper";\nint age = 45;\nConsole.WriteLine($"Hallo {first} {last}, {age} Jahre alt.");',
  },

  // ── Bedingungen ────────────────────────────────────────────────────────
  {
    id: 'cs-fizzbuzz',
    category: 'conditions',
    difficulty: 'easy',
    estimatedMinutes: 6,
    title: t('FizzBuzz', 'FizzBuzz', 'FizzBuzz'),
    description: t(
      'Gib die Zahlen 1–20 aus: "Fizz" für Vielfache von 3, "Buzz" für 5, "FizzBuzz" für beide.',
      'Print numbers 1–20: "Fizz" for multiples of 3, "Buzz" for 5, "FizzBuzz" for both.',
      'Выведите числа 1–20: «Fizz» для кратных 3, «Buzz» для 5, «FizzBuzz» для обоих.',
    ),
    exampleSnippet:
      'for (int i = 1; i <= 20; i++)\n{\n    string s = "";\n    if (i % 3 == 0) s += "Fizz";\n    if (i % 5 == 0) s += "Buzz";\n    Console.WriteLine(s == "" ? i.ToString() : s);\n}',
  },
  {
    id: 'cs-note-switch',
    category: 'conditions',
    difficulty: 'medium',
    estimatedMinutes: 7,
    title: t('Noten mit switch', 'Grades with switch', 'Оценки через switch'),
    description: t(
      'Wandle eine Punktzahl (0–100) mit einem `switch`-Ausdruck in eine Schulnote 1–6 um.',
      'Convert a score (0–100) into a school grade 1–6 using a `switch` expression.',
      'Преобразуйте баллы (0–100) в оценку 1–6 с помощью выражения `switch`.',
    ),
    exampleSnippet:
      'int score = 82;\nint grade = score switch\n{\n    >= 90 => 1,\n    >= 75 => 2,\n    >= 60 => 3,\n    >= 45 => 4,\n    >= 30 => 5,\n    _ => 6,\n};\nConsole.WriteLine(grade);',
  },

  // ── Schleifen ──────────────────────────────────────────────────────────
  {
    id: 'cs-sum-1-100',
    category: 'loops',
    difficulty: 'easy',
    estimatedMinutes: 4,
    title: t('Summe 1 bis 100', 'Sum 1 to 100', 'Сумма от 1 до 100'),
    description: t(
      'Berechne mit einer `for`-Schleife die Summe aller Zahlen von 1 bis 100.',
      'Use a `for` loop to compute the sum of all numbers from 1 to 100.',
      'С помощью цикла `for` вычислите сумму всех чисел от 1 до 100.',
    ),
    exampleSnippet:
      'int sum = 0;\nfor (int i = 1; i <= 100; i++) sum += i;\nConsole.WriteLine(sum); // 5050',
  },
  {
    id: 'cs-multiplication-table',
    category: 'loops',
    difficulty: 'medium',
    estimatedMinutes: 7,
    title: t('Kleines Einmaleins', 'Times table', 'Таблица умножения'),
    description: t(
      'Gib mit zwei verschachtelten Schleifen das Einmaleins von 1×1 bis 5×5 aus.',
      'Use two nested loops to print the times table from 1×1 up to 5×5.',
      'С помощью двух вложенных циклов выведите таблицу умножения от 1×1 до 5×5.',
    ),
    exampleSnippet:
      'for (int i = 1; i <= 5; i++)\n{\n    for (int j = 1; j <= 5; j++)\n        Console.Write($"{i * j,3}");\n    Console.WriteLine();\n}',
  },
  {
    id: 'cs-count-vowels',
    category: 'loops',
    difficulty: 'medium',
    estimatedMinutes: 8,
    title: t('Vokale zählen', 'Count vowels', 'Подсчёт гласных'),
    description: t(
      'Zähle in einem `foreach` über einen String, wie viele Vokale (a, e, i, o, u) er enthält.',
      'Use a `foreach` over a string to count how many vowels (a, e, i, o, u) it contains.',
      'С помощью `foreach` по строке посчитайте, сколько в ней гласных (a, e, i, o, u).',
    ),
    exampleSnippet:
      'string text = "Programmieren";\nint vowels = 0;\nforeach (char c in text.ToLower())\n    if ("aeiou".Contains(c)) vowels++;\nConsole.WriteLine(vowels);',
  },

  // ── Funktionen ─────────────────────────────────────────────────────────
  {
    id: 'cs-factorial',
    category: 'functions',
    difficulty: 'medium',
    estimatedMinutes: 7,
    title: t('Fakultät berechnen', 'Compute factorial', 'Вычисление факториала'),
    description: t(
      'Schreibe eine Methode `long Factorial(int n)`, die n! iterativ berechnet.',
      'Write a method `long Factorial(int n)` that computes n! iteratively.',
      'Напишите метод `long Factorial(int n)`, вычисляющий n! итеративно.',
    ),
    exampleSnippet:
      'long Factorial(int n)\n{\n    long result = 1;\n    for (int i = 2; i <= n; i++) result *= i;\n    return result;\n}\nConsole.WriteLine(Factorial(5)); // 120',
  },
  {
    id: 'cs-fibonacci',
    category: 'functions',
    difficulty: 'hard',
    estimatedMinutes: 10,
    title: t('Fibonacci (rekursiv)', 'Fibonacci (recursive)', 'Фибоначчи (рекурсия)'),
    description: t(
      'Implementiere `int Fib(int n)` rekursiv. Überlege, warum das für große n langsam ist.',
      'Implement `int Fib(int n)` recursively. Consider why this is slow for large n.',
      'Реализуйте `int Fib(int n)` рекурсивно. Подумайте, почему это медленно для больших n.',
    ),
    exampleSnippet:
      'int Fib(int n) => n < 2 ? n : Fib(n - 1) + Fib(n - 2);\nConsole.WriteLine(Fib(10)); // 55',
  },
  {
    id: 'cs-optional-params',
    category: 'functions',
    difficulty: 'easy',
    estimatedMinutes: 5,
    title: t('Optionale Parameter', 'Optional parameters', 'Необязательные параметры'),
    description: t(
      'Schreibe `Greet(string name, string greeting = "Hallo")` und rufe sie mit und ohne zweites Argument auf.',
      'Write `Greet(string name, string greeting = "Hello")` and call it with and without the second argument.',
      'Напишите `Greet(string name, string greeting = "Привет")` и вызовите её с и без второго аргумента.',
    ),
    exampleSnippet:
      'void Greet(string name, string greeting = "Hallo")\n    => Console.WriteLine($"{greeting}, {name}!");\nGreet("Ada");\nGreet("Ada", "Moin");',
  },

  // ── Klassen ────────────────────────────────────────────────────────────
  {
    id: 'cs-class-person',
    category: 'classes',
    difficulty: 'easy',
    estimatedMinutes: 6,
    title: t('Klasse Person', 'Person class', 'Класс Person'),
    description: t(
      'Definiere eine Klasse `Person` mit Auto-Properties `Name` und `Age` und erzeuge ein Objekt per Objekt-Initializer.',
      'Define a class `Person` with auto-properties `Name` and `Age` and create an object using an object initializer.',
      'Определите класс `Person` со свойствами `Name` и `Age` и создайте объект через инициализатор.',
    ),
    exampleSnippet:
      'class Person\n{\n    public string Name { get; set; }\n    public int Age { get; set; }\n}\nvar p = new Person { Name = "Ada", Age = 36 };',
  },
  {
    id: 'cs-constructor-method',
    category: 'classes',
    difficulty: 'medium',
    estimatedMinutes: 8,
    title: t('Konstruktor & Methode', 'Constructor & method', 'Конструктор и метод'),
    description: t(
      'Gib `Person` einen Konstruktor und eine Methode `Describe()`, die einen Vorstellungssatz zurückgibt.',
      'Give `Person` a constructor and a method `Describe()` that returns an introduction sentence.',
      'Добавьте `Person` конструктор и метод `Describe()`, возвращающий строку-представление.',
    ),
    exampleSnippet:
      'class Person\n{\n    public string Name;\n    public Person(string name) => Name = name;\n    public string Describe() => $"Ich bin {Name}.";\n}',
  },

  // ── Listen ─────────────────────────────────────────────────────────────
  {
    id: 'cs-list-basics',
    category: 'lists',
    difficulty: 'easy',
    estimatedMinutes: 5,
    title: t('Liste befüllen', 'Fill a list', 'Заполнение списка'),
    description: t(
      'Erstelle eine `List<int>`, füge drei Zahlen hinzu und gib sie per `foreach` aus.',
      'Create a `List<int>`, add three numbers and print them with `foreach`.',
      'Создайте `List<int>`, добавьте три числа и выведите их через `foreach`.',
    ),
    exampleSnippet:
      'var numbers = new List<int> { 10, 20 };\nnumbers.Add(30);\nforeach (int n in numbers) Console.WriteLine(n);',
  },
  {
    id: 'cs-dictionary-count',
    category: 'lists',
    difficulty: 'hard',
    estimatedMinutes: 10,
    title: t('Wörter zählen', 'Count words', 'Подсчёт слов'),
    description: t(
      'Zähle mit einem `Dictionary<string,int>`, wie oft jedes Wort in einem Satz vorkommt.',
      'Use a `Dictionary<string,int>` to count how often each word appears in a sentence.',
      'С помощью `Dictionary<string,int>` посчитайте, сколько раз встречается каждое слово.',
    ),
    exampleSnippet:
      'var counts = new Dictionary<string, int>();\nforeach (var w in "a b a c b a".Split(\' \'))\n    counts[w] = counts.GetValueOrDefault(w) + 1;\n// a=3, b=2, c=1',
  },

  // ── Vererbung ──────────────────────────────────────────────────────────
  {
    id: 'cs-inheritance-override',
    category: 'inheritance',
    difficulty: 'medium',
    estimatedMinutes: 9,
    title: t('Vererbung & override', 'Inheritance & override', 'Наследование и override'),
    description: t(
      'Erstelle eine Basisklasse `Animal` mit virtueller Methode `Sound()` und eine Klasse `Dog`, die sie überschreibt.',
      'Create a base class `Animal` with a virtual method `Sound()` and a `Dog` class that overrides it.',
      'Создайте базовый класс `Animal` с виртуальным методом `Sound()` и класс `Dog`, переопределяющий его.',
    ),
    exampleSnippet:
      'class Animal { public virtual string Sound() => "..."; }\nclass Dog : Animal { public override string Sound() => "Wuff"; }\nAnimal a = new Dog();\nConsole.WriteLine(a.Sound()); // Wuff',
  },

  // ── Interfaces ─────────────────────────────────────────────────────────
  {
    id: 'cs-interface-area',
    category: 'interfaces',
    difficulty: 'medium',
    estimatedMinutes: 9,
    title: t('Interface IShape', 'IShape interface', 'Интерфейс IShape'),
    description: t(
      'Definiere ein Interface `IShape` mit `double Area()` und implementiere es in `Circle`.',
      'Define an interface `IShape` with `double Area()` and implement it in `Circle`.',
      'Определите интерфейс `IShape` с `double Area()` и реализуйте его в `Circle`.',
    ),
    exampleSnippet:
      'interface IShape { double Area(); }\nclass Circle : IShape\n{\n    public double R;\n    public double Area() => Math.PI * R * R;\n}',
  },

  // ── Enums ──────────────────────────────────────────────────────────────
  {
    id: 'cs-enum-weekday',
    category: 'enums',
    difficulty: 'easy',
    estimatedMinutes: 6,
    title: t('Enum Wochentag', 'Weekday enum', 'Enum «день недели»'),
    description: t(
      'Definiere ein `enum Weekday` und prüfe mit einem `switch`, ob ein Tag ein Wochenende ist.',
      'Define an `enum Weekday` and use a `switch` to check whether a day is on the weekend.',
      'Определите `enum Weekday` и через `switch` проверьте, выходной ли это день.',
    ),
    exampleSnippet:
      'enum Weekday { Mon, Tue, Wed, Thu, Fri, Sat, Sun }\nbool IsWeekend(Weekday d) => d is Weekday.Sat or Weekday.Sun;\nConsole.WriteLine(IsWeekend(Weekday.Sat)); // True',
  },

  // ── Fehlerbehandlung ───────────────────────────────────────────────────
  {
    id: 'cs-try-catch',
    category: 'errors',
    difficulty: 'easy',
    estimatedMinutes: 6,
    title: t('try / catch', 'try / catch', 'try / catch'),
    description: t(
      'Fange beim Parsen einer ungültigen Zahl die `FormatException` ab und gib eine freundliche Meldung aus.',
      'Catch the `FormatException` when parsing an invalid number and print a friendly message.',
      'Перехватите `FormatException` при разборе неверного числа и выведите понятное сообщение.',
    ),
    exampleSnippet:
      'try\n{\n    int n = int.Parse("abc");\n}\ncatch (FormatException)\n{\n    Console.WriteLine("Keine gültige Zahl.");\n}',
  },
  {
    id: 'cs-throw-custom',
    category: 'errors',
    difficulty: 'hard',
    estimatedMinutes: 10,
    title: t('Eigene Exception', 'Custom exception', 'Своё исключение'),
    description: t(
      'Wirf bei negativem Alter eine `ArgumentException` und fange sie im Aufrufer wieder ab.',
      'Throw an `ArgumentException` for a negative age and catch it again in the caller.',
      'Бросьте `ArgumentException` при отрицательном возрасте и перехватите его в вызывающем коде.',
    ),
    exampleSnippet:
      'void SetAge(int age)\n{\n    if (age < 0) throw new ArgumentException("Alter < 0");\n}\ntry { SetAge(-1); }\ncatch (ArgumentException ex) { Console.WriteLine(ex.Message); }',
  },

  // ── Debugging ──────────────────────────────────────────────────────────
  {
    id: 'cs-debug-offbyone',
    category: 'debugging',
    difficulty: 'medium',
    estimatedMinutes: 7,
    title: t('Bug finden: Off-by-one', 'Find the bug: off-by-one', 'Найдите баг: off-by-one'),
    description: t(
      'Diese Schleife wirft eine IndexOutOfRangeException. Finde und behebe den Fehler in der Abbruchbedingung.',
      'This loop throws an IndexOutOfRangeException. Find and fix the error in the loop condition.',
      'Этот цикл бросает IndexOutOfRangeException. Найдите и исправьте ошибку в условии.',
    ),
    exampleSnippet:
      'int[] arr = { 1, 2, 3 };\n// Bug: <= greift auf arr[3] zu\nfor (int i = 0; i <= arr.Length; i++)\n    Console.WriteLine(arr[i]);\n// Fix: i < arr.Length',
  },

  // ── Strings ────────────────────────────────────────────────────────────
  {
    id: 'cs-reverse-string',
    category: 'strings',
    difficulty: 'easy',
    estimatedMinutes: 4,
    title: t('String umkehren', 'Reverse a string', 'Перевернуть строку'),
    description: t(
      'Kehre einen String um – z. B. mit `Array.Reverse` oder LINQ.',
      'Reverse a string – e.g. with `Array.Reverse` or LINQ.',
      'Переверните строку – например, через `Array.Reverse` или LINQ.',
    ),
    exampleSnippet:
      'string s = "hallo";\nstring reversed = new string(s.Reverse().ToArray());\nConsole.WriteLine(reversed); // ollah',
  },
  {
    id: 'cs-palindrome',
    category: 'strings',
    difficulty: 'medium',
    estimatedMinutes: 6,
    title: t('Palindrom prüfen', 'Palindrome check', 'Проверка палиндрома'),
    description: t(
      'Prüfe, ob ein Wort ein Palindrom ist (Groß-/Kleinschreibung ignorieren).',
      'Check whether a word is a palindrome (ignore case).',
      'Проверьте, является ли слово палиндромом (без учёта регистра).',
    ),
    exampleSnippet:
      'bool IsPalindrome(string s)\n{\n    var x = s.ToLower();\n    return x.SequenceEqual(x.Reverse());\n}\nConsole.WriteLine(IsPalindrome("Otto")); // True',
  },

  // ── LINQ ───────────────────────────────────────────────────────────────
  {
    id: 'cs-linq-filter',
    category: 'linq',
    difficulty: 'medium',
    estimatedMinutes: 8,
    title: t('LINQ: Filtern & Sortieren', 'LINQ: filter & sort', 'LINQ: фильтр и сортировка'),
    description: t(
      'Filtere aus einer Zahlenliste die geraden Zahlen und sortiere sie absteigend – mit `Where` und `OrderByDescending`.',
      'From a list of numbers, filter the even ones and sort them descending – using `Where` and `OrderByDescending`.',
      'Из списка чисел отберите чётные и отсортируйте по убыванию – через `Where` и `OrderByDescending`.',
    ),
    exampleSnippet:
      'var nums = new[] { 5, 2, 8, 3, 10 };\nvar result = nums.Where(n => n % 2 == 0)\n                 .OrderByDescending(n => n);\n// 10, 8, 2',
  },
  {
    id: 'cs-linq-aggregate',
    category: 'linq',
    difficulty: 'medium',
    estimatedMinutes: 7,
    title: t('LINQ: Summe & Durchschnitt', 'LINQ: sum & average', 'LINQ: сумма и среднее'),
    description: t(
      'Berechne aus einer Zahlenliste Summe, Durchschnitt und Maximum mit den LINQ-Methoden `Sum`, `Average`, `Max`.',
      'Compute sum, average and maximum of a number list using the LINQ methods `Sum`, `Average`, `Max`.',
      'Вычислите сумму, среднее и максимум списка чисел через методы LINQ `Sum`, `Average`, `Max`.',
    ),
    exampleSnippet:
      'var nums = new[] { 4, 8, 15, 16, 23, 42 };\nConsole.WriteLine(nums.Sum());\nConsole.WriteLine(nums.Average());\nConsole.WriteLine(nums.Max());',
  },
];

// ─── Deterministische Tagesauswahl ──────────────────────────────────────────

/**
 * Stabile, DST-sichere Tagesnummer für den *lokalen* Kalendertag.
 * Wichtig: identische Kalenderlogik wie `toDateKey` (lokaler Tag), damit die
 * angezeigte Challenge und das "erledigt"-Tracking nie auseinanderlaufen.
 */
function localDayNumber(date: Date): number {
  // UTC-Mitternacht *desselben* Kalendertags → immer exakt 24 h Abstand,
  // keine Sommerzeit-Sprünge (anders als date.getTime() / 86_400_000).
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Kleiner, deterministischer PRNG (mulberry32) für reproduzierbares Shuffle. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates-Permutation von [0..count-1] mit gegebenem Seed. */
function shuffledIndices(count: number, seed: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  const rand = mulberry32(seed);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Wählt eine Challenge deterministisch basierend auf dem lokalen Kalendertag.
 *
 * Innerhalb eines "Zyklus" (so viele Tage wie Challenges im Pool) erscheint
 * jede Challenge genau einmal; die Reihenfolge wird pro Zyklus neu gemischt,
 * sodass sich weder Auswahl noch Abfolge trivial wiederholen.
 */
export function pickDailyChallenge(date: Date = new Date()): DailyChallenge {
  const n = DAILY_CHALLENGES.length;
  const day = localDayNumber(date);
  const cycle = Math.floor(day / n);
  const pos = ((day % n) + n) % n;
  const order = shuffledIndices(n, cycle >>> 0);
  return DAILY_CHALLENGES[order[pos]];
}
