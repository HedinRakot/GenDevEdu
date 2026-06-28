Often you want to do something with **every** element of a list, for example print all the names. Writing this out by hand with `list[0]`, `list[1]` and so on would be tedious. Instead, you let a loop run over the list.

## Looping with `foreach`

The simplest option is `foreach`. It automatically takes one element after another:

```csharp
List<string> animals = new List<string>() { "Dog", "Cat", "Mouse" };

foreach (string animal in animals)
{
    Console.WriteLine("Animal: " + animal);
}
```

Output:

```
Animal: Dog
Animal: Cat
Animal: Mouse
```

With `foreach (string animal in animals)`, the variable `animal` is the current element in each pass. You do not have to deal with indexes.

## Looping with `for`

Sometimes you need the position (the index), for example to print it as well. Then you use a `for` loop together with `.Count`:

```csharp
List<int> numbers = new List<int>() { 10, 20, 30 };

for (int i = 0; i < numbers.Count; i++)
{
    Console.WriteLine("Position " + i + ": " + numbers[i]);
}
```

Output:

```
Position 0: 10
Position 1: 20
Position 2: 30
```

Here `i` runs from `0` up to just before `numbers.Count`. With `numbers[i]` you get the element at the current position.

## When to use which?

- **`foreach`**: when you only need the values (simpler and clearer)
- **`for`**: when you also need the position or want to change specific elements

For beginners, `foreach` is usually the best choice.
