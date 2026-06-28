Now practise defining and using your own enumerations. Write your code in a console application and test the output.

1. **Traffic light enum**
   Define an enum `TrafficLight` with the values `Red`, `Yellow` and `Green`. Declare a variable and assign it `TrafficLight.Red`. Print the value with `Console.WriteLine`.

2. **React with switch**
   Write a `switch` over your traffic light variable: for `Red` print "Stop!", for `Yellow` print "Caution!", and for `Green` print "Go!".

3. **Order status**
   Define an enum `OrderStatus` with `Open`, `Paid`, `Shipped` and `Delivered`. Declare a variable with the value `OrderStatus.Shipped` and use an `if` to check whether the order is already `Delivered`. Print a suitable message.

4. **Multiple orders**
   Create an array `OrderStatus[]` with several values. Iterate over it with `foreach` and print one line for each status, e.g. `"Status: Paid"`.

5. **Check the weekend (bonus)**
   Define an enum `Weekday` and write a variable `today`. Use an `if` to check whether `today` is `Saturday` or `Sunday`, and print "Weekend" or "Workday".
