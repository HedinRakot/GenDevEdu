Imagine you want to store the names of three friends. With what you know so far, you would create three variables:

```csharp
string friend1 = "Anna";
string friend2 = "Ben";
string friend3 = "Clara";
```

That works, but it is clumsy. What do you do with ten friends? Or when you do not even know in advance how many there will be? This is exactly what **lists** are for.

## What is a list?

A list is a container that can hold many values of the same type. In C# this type is called `List<T>`. The `T` stands for the type of values you want to store, for example `string` or `int`.

## Creating a list

This is how you create an empty list for text values (`string`):

```csharp
List<string> friends = new List<string>();
```

You can also fill a list with values right away:

```csharp
List<string> friends = new List<string>() { "Anna", "Ben", "Clara" };
List<int> numbers = new List<int>() { 3, 7, 12 };

Console.WriteLine("The list contains friends and numbers.");
Console.WriteLine(friends[0]);
Console.WriteLine(numbers[2]);
```

Output:

```
The list contains friends and numbers.
Anna
12
```

## Why lists are better

With `friends[0]` you access the first element (counting starts at `0`!). A list can grow as needed, you can add and remove elements, and you can conveniently loop over all elements. You will learn all of this in the next lessons.

Remember: a variable stores **one** value, a list stores **many** values of the same type.
