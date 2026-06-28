Now you practice inheritance yourself. You will need base classes, derived classes with `:`, as well as `virtual` and `override`.

## Exercises

1. **Animal, Dog and Cat**
   Create a base class `Animal` with a field `Name` and a `virtual` method `Speak()` that prints `... makes a sound.`. Derive `Dog` and `Cat` from it and override `Speak()` with a fitting sound for each. Create one object of each class and call `Speak()`.

2. **Add your own field**
   Extend the `Dog` class with a field `Breed`. For a `Dog` object, print the name, the breed, and the result of `Speak()`.

3. **Vehicle and Car**
   Create a base class `Vehicle` with a field `Brand` and a method `Start()` that prints `The vehicle starts.`. Derive a class `Car` that has an additional field `NumberOfDoors`. Create a `Car` and print the brand, the number of doors, and the result of `Start()`.

4. **Override a method**
   Make `Start()` in `Vehicle` a `virtual` method and override it in `Car` so that it prints `The car starts with a rumble.`.

5. **Several animals in a list**
   Create a `List<Animal>` and add a `Dog` and a `Cat`. Loop over the list with a `foreach` loop and call `Speak()` for each animal. Notice that each animal prints its own sound.
