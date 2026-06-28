You have already learned about classes, for example a `Person` class. Now imagine you also need a `Student` class. A student basically **is** a person, but additionally has a student ID. Would you now have to retype everything from `Person` (name, age) all over again? No! This is exactly where **inheritance** helps.

## The idea of inheritance

With inheritance there is a **base class** (also called the parent class) and a **derived class** (also called the child class). The derived class inherits all fields and methods of the base class and can add its own.

A good rule of thumb is the "is a" sentence:

- A student **is a** person.
- A dog **is an** animal.
- A car **is a** vehicle.

If this sentence makes sense, inheritance is a good fit.

## An example

First the base class `Person`:

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

Now the derived class `Student`. The `:` means "inherits from":

```csharp
class Student : Person
{
    public string StudentId;
}
```

Although `Student` itself only contains `StudentId`, a student has also inherited `Name`, `Age` and the method `Introduce()`:

```csharp
Student s = new Student();
s.Name = "Anna";
s.Age = 21;
s.StudentId = "12345";

s.Introduce();
Console.WriteLine("Student ID: " + s.StudentId);
```

Output:

```
Hello, my name is Anna.
Student ID: 12345
```

## Why this is handy

Inheritance saves typing and avoids repetition. Shared properties live once in the base class, while special features go into the derived classes. In the next lessons you will build your own derived classes.
