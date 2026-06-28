Programs rarely run perfectly on the first try. Sometimes the user types something unexpected, a file is missing, or a calculation is impossible. So that your program does not simply crash in such situations, you need to understand **what errors are** and how C# reports them.

## Two kinds of errors

There are roughly two categories of errors:

- **Logic errors**: The program runs without crashing, but does something wrong. For example, you calculate an average and accidentally divide by the wrong number. The computer does not complain, but the result is incorrect.
- **Runtime errors**: While the program is running, something happens that C# cannot carry out. The program stops and shows an error message. In C#, these runtime errors are called **exceptions**.

## What is an exception?

An **exception** is a signal that C# raises when something goes wrong. Imagine you give a program a task it simply cannot complete. Instead of carrying on with wrong calculations, C# "throws" an exception and stops the normal flow of execution.

## Example 1: Parsing bad input

With `int.Parse` you can convert text into a number. But what happens if the text is not a number at all?

```csharp
string input = "Hello";
int number = int.Parse(input); // An exception is thrown here!
Console.WriteLine(number);
```

`"Hello"` cannot be converted into a number. C# throws a `FormatException` and the program crashes before `Console.WriteLine` is ever reached.

## Example 2: Division by zero

In mathematics you may not divide by zero. C# does not allow it either:

```csharp
int a = 10;
int b = 0;
int result = a / b; // A DivideByZeroException is thrown here!
Console.WriteLine(result);
```

As soon as C# tries to compute `10 / 0`, a `DivideByZeroException` is thrown.

## Why does this matter?

If an exception is not handled, your program crashes. That is unpleasant for users. In the next lessons you will learn how to catch such errors with `try` and `catch`, so that your program reacts gracefully instead of simply giving up.
