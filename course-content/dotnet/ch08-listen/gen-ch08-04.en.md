Now it is your turn! Practice working with lists using the following tasks. You will need `List<T>`, `.Add()`, index access, `.Count`, as well as `foreach` or `for`.

## Exercises

1. **Shopping list**
   Create a `List<string>` and use `.Add()` to add at least four groceries. Then print the entire list with a `foreach` loop, each line prefixed with the text `Buy: `.

2. **Count your list**
   Use `.Count` to print how many items your shopping list has. Then remove one item with `.RemoveAt(1)` and print the count again.

3. **Sum of a number list**
   Create a `List<int>` with the numbers `5, 8, 2, 10`. Use a loop to calculate the sum of all numbers and print the result (expected: `25`).

4. **Find the largest element**
   Use the same number list. Use a loop to find the largest number and print it. Hint: keep the largest value found so far in a variable and compare every element against it.

5. **Search in the list**
   Ask the user for a grocery item using `Console.ReadLine()`. Use a loop to check whether it appears in your shopping list, and print `Found!` or `Not in the list.`.
