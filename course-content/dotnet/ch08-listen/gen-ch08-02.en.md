A list only becomes useful once you can change it. You can add elements, access individual elements, and remove elements again. Let us look at the most important tools.

## Adding with `.Add()`

The `.Add()` method appends a new element to the end of the list:

```csharp
List<string> shopping = new List<string>();
shopping.Add("Milk");
shopping.Add("Bread");
shopping.Add("Apples");

Console.WriteLine("Something was added to the list.");
```

## Access by index

Every element has a position, called the **index**. Counting starts at `0`:

```csharp
Console.WriteLine(shopping[0]); // Milk
Console.WriteLine(shopping[1]); // Bread
Console.WriteLine(shopping[2]); // Apples
```

## How many elements? `.Count`

With `.Count` you find out how many elements are in the list:

```csharp
Console.WriteLine("Number of items: " + shopping.Count);
```

Output:

```
Number of items: 3
```

## Removing with `.Remove()` and `.RemoveAt()`

Use `.Remove()` to remove an element by its value, and `.RemoveAt()` to remove it by its index:

```csharp
shopping.Remove("Bread");  // removes "Bread"
shopping.RemoveAt(0);      // removes the element at position 0 (Milk)

Console.WriteLine("Left: " + shopping[0]);
Console.WriteLine("Count: " + shopping.Count);
```

Output:

```
Left: Apples
Count: 1
```

## In summary

- `.Add(value)` appends to the end
- `list[index]` accesses an element
- `.Count` returns the number of elements
- `.Remove(value)` removes by value
- `.RemoveAt(index)` removes by position

Watch out: if you access an index that does not exist (for example `shopping[5]` when there are only 3 elements), the program crashes. When in doubt, check `.Count` first.
