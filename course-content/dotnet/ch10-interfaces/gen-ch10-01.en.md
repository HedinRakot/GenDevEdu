Picture a remote control. No matter which brand your TV is, there is always a power button. The remote promises you: "I have an on-switch." *How* the device reacts internally doesn't matter – all that matters is that the button exists.

That is exactly what an **interface** is: a **contract**. A class that implements an interface promises to provide certain methods.

## An interface is just a promise

An interface describes *what* a class must be able to do – but not *how*. It contains only method signatures, no finished code.

```csharp
interface IAnimal
{
    void MakeSound();
}
```

The `I` at the start of the name is a common convention for interfaces (from *interface*).

This says: "Every animal must have a method `MakeSound()`." How a dog or a cat makes that sound is deliberately **not** decided by the interface. So there is no method body with `{ ... }`, just the signature followed by a semicolon.

## Why is this useful?

An interface lets you treat different classes the same way, as long as they fulfil the same contract. Just as every remote has a power button, every `IAnimal` can make a sound – whether it's a dog, a cat or a bird.

```csharp
Console.WriteLine("An interface is a contract.");
Console.WriteLine("It defines WHAT a class can do - not HOW.");
```

In the next section we'll write a real class that fulfils this contract.
