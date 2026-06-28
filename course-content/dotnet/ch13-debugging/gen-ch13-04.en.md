Now you will practice debugging yourself. For these tasks you need Visual Studio and a small console project. Try out the tools you have learned: breakpoints, F5, F10, F11, and watching variables.

## Exercises

1. **Set a breakpoint and observe**: Write a loop that counts from `1` to `5` and increases a variable `sum` in each iteration. Set a breakpoint inside the loop (F9), start the debugger (F5), and press F10 several times. Note which values `i` and `sum` take in each step.

2. **Find the off-by-one**: You are given this description of a bug: A `for` loop iterates over an array with the condition `i <= array.Length`. When run, the program crashes with an `IndexOutOfRangeException`. Explain why the error occurs and write the corrected loop.

3. **Comparison or assignment**: Look at the following description: A program is supposed to check whether a number is `equal to 10`, but it always prints the same branch, no matter which number is entered. Which typical mistake could be the cause? Write down the correct `if` condition.

4. **Add tracing**: Take a program that calculates a sum or a product in a loop, and add `Console.WriteLine` outputs that show the intermediate values in each iteration. Run the program and use the outputs to verify whether the calculation is correct.

5. **Try Step Into**: Write a small method, for example `int Double(int x)`, and call it from `Main`. Set a breakpoint on the call, start the debugger, and use F11 (Step Into) to jump into the method. Watch the value of `x` inside the method.
