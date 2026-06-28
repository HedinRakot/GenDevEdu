Some errors show up again and again for beginners. If you know them, you spot them faster. Here are the most common bugs and how to track them down.

## Off-by-one errors in loops

An **off-by-one error** means: a loop runs one time too many or one time too few. Often it comes down to the comparison `<` versus `<=`.

```csharp
int[] numbers = { 10, 20, 30 };
for (int i = 0; i <= numbers.Length; i++) // Bug: <= instead of <
{
    Console.WriteLine(numbers[i]);
}
```

The array has the indices `0`, `1` and `2`. With `<=`, however, the loop runs up to `i = 3` and accesses `numbers[3]`, which does not exist. This causes an `IndexOutOfRangeException`. The correct version is `i < numbers.Length`.

## `=` instead of `==`

A single `=` is an **assignment**, a double `==` is a **comparison**. Mixing them up leads to unexpected behavior:

```csharp
int age = 18;
if (age == 18) // correct: comparison
{
    Console.WriteLine("Exactly 18.");
}
```

In C# the compiler often protects you, because `if (age = 18)` does not produce a valid truth value. With `bool` variables, however, the mistake can slip through. So always check that you really use `==` for comparing.

## Null or empty input

`Console.ReadLine()` can return an empty string if the user just presses Enter. If you rely on there being content, this can cause problems:

```csharp
string name = Console.ReadLine();
Console.WriteLine("Hello, " + name.ToUpper()); // error if name is null/empty
```

So check the input before you use it:

```csharp
string name = Console.ReadLine();
if (string.IsNullOrEmpty(name))
{
    Console.WriteLine("You did not enter a name.");
}
else
{
    Console.WriteLine("Hello, " + name.ToUpper());
}
```

## Tracing with `Console.WriteLine`

Sometimes you do not need a debugger; you simply add some output to see what is happening. This is called **tracing**:

```csharp
int sum = 0;
for (int i = 1; i <= 3; i++)
{
    sum = sum + i;
    Console.WriteLine("i = " + i + ", sum = " + sum); // trace output
}
```

This way you see in the console exactly how the values develop. After debugging, you remove these helper outputs again.

If you keep these typical mistakes in mind, you will find many bugs just by reading through your code the first time.
