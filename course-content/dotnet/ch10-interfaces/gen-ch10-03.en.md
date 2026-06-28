Time to practise! These tasks reinforce how to define and implement interfaces. Write your code in a console application and test the output.

1. **The `IShape` interface**
   Define an interface `IShape` with a method `double Area()` that returns the area.

2. **Implement Circle**
   Write a class `Circle : IShape`. It should have a field or property `Radius` and return `3.14159 * Radius * Radius` from `Area()`. Create a circle with radius 5 and print its area with `Console.WriteLine`.

3. **Implement Rectangle**
   Write a second class `Rectangle : IShape` with `Width` and `Height`. `Area()` should return `Width * Height`. Print the area of a rectangle (e.g. 4 x 3).

4. **All shapes in a loop**
   Create an array `IShape[]` that holds a circle and a rectangle. Iterate over it with `foreach` and print the area of each shape.

5. **One more shape (bonus)**
   Extend your program with a class `Square : IShape` that has a `SideLength`. Add this object to your array as well and confirm that the loop still works unchanged.
