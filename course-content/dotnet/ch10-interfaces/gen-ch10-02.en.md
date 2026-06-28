We learned that an interface is a contract. Now let's fulfil that contract with a real class.

## Fulfilling the contract

A class implements an interface by listing it after the class name with a colon and writing out **all** of the interface's methods.

```csharp
interface IAnimal
{
    void MakeSound();
}

class Dog : IAnimal
{
    public void MakeSound()
    {
        Console.WriteLine("Woof!");
    }
}
```

Important: the method must be `public` and match the signature in the interface exactly. If you forget the method, the compiler reports an error – the contract would be broken.

```csharp
Dog rex = new Dog();
rex.MakeSound();   // Output: Woof!
```

## Using it through the interface type

Here's the special part: you can use a variable of the **interface type**. It can hold any object that fulfils the contract.

```csharp
IAnimal myAnimal = new Dog();
myAnimal.MakeSound();   // Output: Woof!
```

The variable `myAnimal` doesn't care *which* class is behind it – only that it can `MakeSound()`.

## Many classes, one contract

Many different classes can implement the same interface:

```csharp
class Cat : IAnimal
{
    public void MakeSound()
    {
        Console.WriteLine("Meow!");
    }
}

IAnimal[] animals = { new Dog(), new Cat() };

foreach (IAnimal animal in animals)
{
    animal.MakeSound();
}
// Output:
// Woof!
// Meow!
```

This lets you treat very different objects the same way in a loop – that's the great strength of interfaces.
