Even experienced developers write programs that do not work correctly right away. A program does something unexpected, crashes, or shows a wrong result. These problems are called **bugs**, and the systematic process of finding and fixing them is called **debugging**.

## What is a bug?

A **bug** is a mistake in the code that causes the program to behave differently than intended. The term comes from the early days of computing, when an actual insect once jammed a machine. Today "bug" means any programming mistake, big or small.

Examples of bugs:

- A loop runs one time too many.
- A calculation uses the wrong variable.
- The program crashes when the user enters nothing.

## Debugging is detective work

When debugging, you act like a detective. You have a clue (the wrong behavior) and you systematically search for the cause. The important thing is: do not guess wildly, but proceed step by step:

1. **Observe**: What exactly happens? What did you expect?
2. **Narrow down**: In which part of the code does the error occur?
3. **Hypothesize**: What could the cause be?
4. **Check**: Is your hypothesis correct? Test it.
5. **Fix**: Correct the error and verify that everything works again.

## Reading error messages

Your most important ally is the **error message**. When a program crashes, C# often gives you a precise description. Read it carefully:

```text
System.FormatException: The input string 'abc' was not in a correct format.
   at Program.Main() in Program.cs:line 7
```

This message tells you several things at once:

- **Which error type**: `FormatException` points to a format problem.
- **What went wrong**: The text `'abc'` was not in the correct format.
- **Where**: in `Program.cs`, line 7.

Beginners often skip error messages because they look technical. But that is usually exactly where the solution is. In the next lessons you will learn tools that let you watch your program while it runs, to find bugs even more easily.
