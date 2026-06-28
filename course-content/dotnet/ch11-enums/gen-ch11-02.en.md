Now let's use an enum in real code: declaring a variable, comparing values and printing them.

## A variable of the enum type

You use the enum name like any other data type:

```csharp
enum Weekday
{
    Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
}

Weekday today = Weekday.Saturday;
Console.WriteLine($"Today is {today}.");   // Output: Today is Saturday.
```

## Comparing with if

Use `==` to check which value the variable holds:

```csharp
if (today == Weekday.Saturday || today == Weekday.Sunday)
{
    Console.WriteLine("Weekend! Sleep in.");
}
else
{
    Console.WriteLine("Workday.");
}
// Output: Weekend! Sleep in.
```

## Cleaner with switch

When you want to react to many values, a `switch` is often clearer than lots of `if` blocks:

```csharp
switch (today)
{
    case Weekday.Monday:
        Console.WriteLine("A new week begins.");
        break;
    case Weekday.Friday:
        Console.WriteLine("Almost weekend!");
        break;
    case Weekday.Saturday:
    case Weekday.Sunday:
        Console.WriteLine("Weekend.");
        break;
    default:
        Console.WriteLine("A normal workday.");
        break;
}
// Output: Weekend.
```

Note: you must write `Weekday.` before the value so it's clear which enum the value comes from. With this knowledge you can model states in your programs cleanly and safely.
