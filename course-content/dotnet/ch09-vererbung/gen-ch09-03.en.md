Sometimes a derived class should do an inherited method **differently** than the base class. Example: every animal can make a sound, but a dog barks and a cat meows. For this there is method **overriding** using `virtual` and `override`.

## `virtual` in the base class

In the base class you mark the method that may be overridden with the keyword `virtual`:

```csharp
class Animal
{
    public string Name;

    public virtual void Speak()
    {
        Console.WriteLine(Name + " makes a sound.");
    }
}
```

`virtual` means: "This method may be replaced by derived classes."

## `override` in the derived class

In the derived class you write the same method again, this time with `override`:

```csharp
class Dog : Animal
{
    public override void Speak()
    {
        Console.WriteLine(Name + " barks: Woof!");
    }
}

class Cat : Animal
{
    public override void Speak()
    {
        Console.WriteLine(Name + " meows: Meow!");
    }
}
```

## The result

Each class now uses its own version of `Speak()`:

```csharp
Dog rex = new Dog();
rex.Name = "Rex";

Cat mimi = new Cat();
mimi.Name = "Mimi";

rex.Speak();
mimi.Speak();
```

Output:

```
Rex barks: Woof!
Mimi meows: Meow!
```

## Remember

- `virtual` goes in the **base class**: the method may be overridden.
- `override` goes in the **derived class**: the method is replaced.
- A derived class that does not override simply uses the version from the base class.

This way each class can implement the shared behavior in its own way.
