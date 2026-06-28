Imagine storing the day of the week as a number: `1` for Monday, `2` for Tuesday and so on. That works – but what does `5` mean again? And what happens if someone accidentally enters `99`? Such "magic numbers" are error-prone and hard to read.

Text values like `"monday"` are just as problematic. A typo (`"Mondy"`) only shows up at runtime, and there's no fixed list of allowed values.

## The solution: an enum

An **enumeration** (*enum*) is its own data type with a **fixed set of named values**. You define all the allowed values once – and only those are possible.

```csharp
enum Weekday
{
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
}
```

Now `Weekday` is a type, just like `int` or `string`. The values have meaningful names instead of anonymous numbers.

```csharp
Console.WriteLine(Weekday.Monday);    // Output: Monday
Console.WriteLine(Weekday.Friday);    // Output: Friday
```

## Why is this better?

- **Readable:** `Weekday.Friday` says immediately what is meant – unlike `5`.
- **Safe:** The compiler only allows the defined values. `Weekday.Frday` doesn't exist and causes an error – while you're typing, not at runtime.
- **Convenient:** Your editor automatically suggests all the possible values.

Behind the scenes each enum value is actually a number (`Monday` is `0`, `Tuesday` is `1` …), but in your code you work with the clear names. We'll look at how to use an enum next.
