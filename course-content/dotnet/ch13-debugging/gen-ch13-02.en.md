An error message tells you *that* something went wrong. But how do you find out *why*? This is where the **debugger** in Visual Studio helps. With it you can pause your program and watch, line by line, what values your variables currently have.

## Setting breakpoints (F9)

A **breakpoint** is a marker on a line of code. When the program reaches this line, it pauses there before the line is executed.

This is how you set a breakpoint in Visual Studio:

- Click in the grey margin to the left of a line of code, **or**
- place the cursor in the line and press **F9**.

A red dot then appears on the line. This shows you where the program will pause later.

## Start Debugging (F5)

Instead of starting the program normally, you now start it with the debugger. Press **F5** (Start Debugging) or click the green arrow.

The program now runs as usual until it reaches a breakpoint. There it pauses. The current line is highlighted in yellow. It is the line that will be executed **next**, but has not run yet.

## Step by step: Step Over (F10) and Step Into (F11)

When the program is paused, you can let it continue line by line:

- **Step Over (F10)**: Runs the current line and pauses at the next line. If the line calls a method, that method runs completely without you looking inside it.
- **Step Into (F11)**: Like Step Over, but if the line calls a method, the debugger jumps **into** that method, so you can step through it line by line as well.

This way you feel your way through your program and see exactly which path it takes.

## Watching variables

The best part of the debugger: while the program is paused, you can see the current values of your variables. Just hover the mouse over a variable in the code, and Visual Studio shows its current value. Alternatively, at the bottom you will find the **Locals** and **Watch** windows, which list all variables and their values.

## A small example

```csharp
int sum = 0;
for (int i = 1; i <= 3; i++)
{
    sum = sum + i; // set a breakpoint here (F9)
}
Console.WriteLine(sum);
```

Set a breakpoint on the line `sum = sum + i;`, start with **F5**, and then press **F10** several times. Watch how `i` and `sum` change with each loop iteration. This way you see exactly how the sum is built up step by step.

With this technique you find bugs much faster than by just staring at the code.
