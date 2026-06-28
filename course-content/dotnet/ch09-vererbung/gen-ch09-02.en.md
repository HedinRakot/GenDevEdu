A derived class is much more than just a copy of the base class. It can add its **own** fields and methods while still reusing everything from the base class. This is exactly what makes inheritance so useful.

## Base and extension

We stay with the `Person` and `Student` example. Here is the base class:

```csharp
class Person
{
    public string Name;
    public int Age;

    public void Introduce()
    {
        Console.WriteLine("Hello, my name is " + Name + ".");
    }
}
```

The derived class `Student` gets its own field and its own method:

```csharp
class Student : Person
{
    public string Subject;

    public void Study()
    {
        Console.WriteLine(Name + " is studying " + Subject + ".");
    }
}
```

Note: inside the `Study()` method you may use `Name` directly, even though `Name` is defined in `Person`. Inherited fields belong to the derived class just as much.

## Using it all together

```csharp
Student anna = new Student();
anna.Name = "Anna";
anna.Age = 21;
anna.Subject = "Computer Science";

anna.Introduce(); // inherited from Person
anna.Study();     // Student's own method
```

Output:

```
Hello, my name is Anna.
Anna is studying Computer Science.
```

## What goes where?

- What **everyone** has in common (`Name`, `Age`, `Introduce`) belongs in the base class.
- What only applies to `Student` (`Subject`, `Study`) belongs in the derived class.

This creates a clean structure: you write shared things only once and add the special parts where they are needed.
