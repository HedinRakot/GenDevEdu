Now that you know exceptions can crash your program, you will learn how to **catch** them. The tool for this is `try`/`catch`. With it you can try out risky code and react calmly if something goes wrong.

## The basic structure

You place the risky code inside a `try` block. If an exception occurs there, C# immediately jumps into the `catch` block:

```csharp
try
{
    int number = int.Parse("Hello");
    Console.WriteLine(number);
}
catch (Exception e)
{
    Console.WriteLine("That was not a valid number.");
}
```

Instead of a crash, the friendly message `That was not a valid number.` now appears. The program continues normally afterwards.

## What is `e`?

In `catch (Exception e)`, `e` is an object that contains information about the error. Especially useful is `e.Message`, which gives a short description of the problem:

```csharp
try
{
    int number = int.Parse("Hello");
}
catch (Exception e)
{
    Console.WriteLine("Error: " + e.Message);
}
```

## The `finally` block

Sometimes you want to run code **whether an error occurred or not**. That is what `finally` is for. This block always runs, right at the end:

```csharp
try
{
    Console.WriteLine("I am trying something...");
    int number = int.Parse("abc");
}
catch (Exception e)
{
    Console.WriteLine("Something went wrong.");
}
finally
{
    Console.WriteLine("This part always runs.");
}
```

`finally` is well suited for cleanup, for example closing files.

## Practical example: catching input

Here the program reads input from the user and handles invalid input gracefully:

```csharp
Console.Write("Enter a number: ");
string input = Console.ReadLine();

try
{
    int number = int.Parse(input);
    Console.WriteLine("Double that is: " + (number * 2));
}
catch (FormatException)
{
    Console.WriteLine("Sorry, that was not a valid number.");
}
```

Note: you can catch a **specific** exception, here `FormatException`. This way you respond exactly to the error type you expect. If you specify `Exception`, you catch every kind of error.

With `try`/`catch`, your program stays stable even when users enter something unexpected.
