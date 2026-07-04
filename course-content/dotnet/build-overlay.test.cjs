// Unit-Tests fuer die Code-Aufgaben-Abbildung des Overlay-Builders.
// Lauf: node --test course-content/dotnet/build-overlay.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mapCodeQuestion } = require('./build-overlay-js.cjs');

test('mappt eine vollstaendige Code-Frage auf das PascalCase-BSON-Modell', () => {
  const qd = {
    _id: 'qz-ch05-code-1',
    type: 4,
    code: {
      language: 0,
      starterCode: 'var n = 0;',
      solutionCode: 'Console.WriteLine(n);',
      timeLimitMs: 4000,
      memoryLimitMb: 128,
      testCases: [
        { input: '5\n', expectedOutput: '15', hidden: false },
        { input: '10\n', expectedOutput: '55', hidden: true },
      ],
    },
  };

  const code = mapCodeQuestion(qd);

  assert.equal(code.Language, 0);
  assert.equal(code.StarterCode, 'var n = 0;');
  assert.equal(code.SolutionCode, 'Console.WriteLine(n);');
  assert.equal(code.TimeLimitMs, 4000);
  assert.equal(code.MemoryLimitMb, 128);
  assert.equal(code.TestCases.length, 2);

  // Deterministische IDs <questionId>-tc<index>.
  assert.equal(code.TestCases[0].Id, 'qz-ch05-code-1-tc0');
  assert.equal(code.TestCases[1].Id, 'qz-ch05-code-1-tc1');
  assert.equal(code.TestCases[0].Input, '5\n');
  assert.equal(code.TestCases[0].ExpectedOutput, '15');
  assert.equal(code.TestCases[0].Hidden, false);
  assert.equal(code.TestCases[1].Hidden, true);
});

test('setzt sinnvolle Defaults bei fehlenden optionalen Feldern', () => {
  const code = mapCodeQuestion({ _id: 'q', type: 4, code: { testCases: [{ expectedOutput: 'x' }] } });

  assert.equal(code.Language, 0);
  assert.equal(code.StarterCode, '');
  assert.equal(code.SolutionCode, '');
  assert.equal(code.TimeLimitMs, 5000);
  assert.equal(code.MemoryLimitMb, 256);
  assert.equal(code.TestCases[0].Id, 'q-tc0');
  assert.equal(code.TestCases[0].Input, '');
  assert.equal(code.TestCases[0].Hidden, false);
});

test('uebernimmt eine explizit gesetzte TestCase-Id', () => {
  const code = mapCodeQuestion({ _id: 'q', type: 4, code: { testCases: [{ id: 'custom-id', input: '1' }] } });
  assert.equal(code.TestCases[0].Id, 'custom-id');
});

test('robust gegen fehlendes code-Objekt (leeres Modell mit Defaults)', () => {
  const code = mapCodeQuestion({ _id: 'q', type: 4 });
  assert.equal(code.Language, 0);
  assert.deepEqual(code.TestCases, []);
});
