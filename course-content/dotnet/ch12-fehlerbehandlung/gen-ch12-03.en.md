Now it is your turn! Practice catching errors with `try`, `catch` and `finally`. Write a small program for each task and test it with different inputs, including deliberately wrong ones.

## Exercises

1. **Safe number input**: Write a program that asks the user for a number and reads it with `Console.ReadLine()`. Convert the input into a number with `int.Parse` and print it. Use `try`/`catch` to handle the case where no valid number was entered, and then show a friendly message.

2. **Safe division**: Ask the user for two numbers and divide the first by the second. Use `catch (DivideByZeroException)` to handle the case where the second number is `0`, and print a suitable message.

3. **Input loop**: Extend exercise 1 so that the program keeps asking for a number until the user actually enters a valid one. Use a loop together with `try`/`catch`.

4. **Try out `finally`**: Write a program with a `try` block that processes a faulty input, a `catch` block and a `finally` block. In the `finally` block, print the message `Thank you for your input.` and verify that it appears for both correct and incorrect input.

5. **Show the error message**: Write a program that deliberately triggers an exception (for example `int.Parse("abc")`) and prints the `e.Message` property in the `catch` block. Observe what information C# gives you about the error.
