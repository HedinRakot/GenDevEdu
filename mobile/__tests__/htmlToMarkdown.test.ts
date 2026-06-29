import { htmlToMarkdown } from '@/utils/htmlToMarkdown';

describe('htmlToMarkdown', () => {
  it('returns empty string for nullish input', () => {
    expect(htmlToMarkdown(null)).toBe('');
    expect(htmlToMarkdown(undefined)).toBe('');
    expect(htmlToMarkdown('')).toBe('');
  });

  it('leaves plain text / markdown untouched', () => {
    expect(htmlToMarkdown('Just plain text')).toBe('Just plain text');
    expect(htmlToMarkdown('# Heading\n\n- a\n- b')).toBe('# Heading\n\n- a\n- b');
  });

  it('converts paragraphs to blank-line separated text', () => {
    expect(htmlToMarkdown('<p>First</p><p>Second</p>')).toBe('First\n\nSecond');
  });

  it('converts unordered lists to markdown bullets', () => {
    const html = '<p>Types:</p><ul><li>Text</li><li>Numbers</li></ul>';
    expect(htmlToMarkdown(html)).toBe('Types:\n\n- Text\n- Numbers');
  });

  it('converts ordered lists to numbered markdown', () => {
    const html = '<ol><li>one</li><li>two</li><li>three</li></ol>';
    expect(htmlToMarkdown(html)).toBe('1. one\n2. two\n3. three');
  });

  it('converts inline formatting', () => {
    expect(htmlToMarkdown('<p>This is <strong>bold</strong> and <em>italic</em>.</p>')).toBe(
      'This is **bold** and *italic*.',
    );
  });

  it('converts links and images', () => {
    expect(htmlToMarkdown('<a href="https://x.dev">Docs</a>')).toBe('[Docs](https://x.dev)');
    expect(htmlToMarkdown('<img alt="Logo" src="/l.png">')).toBe('![Logo](/l.png)');
    expect(htmlToMarkdown('<img src="/l.png" alt="Logo">')).toBe('![Logo](/l.png)');
  });

  it('unwraps styling spans but keeps their text', () => {
    expect(htmlToMarkdown('<p><span style="color:red">Red</span> text</p>')).toBe('Red text');
  });

  it('turns <br> into newlines', () => {
    expect(htmlToMarkdown('<p>Line 1<br>Line 2</p>')).toBe('Line 1\nLine 2');
  });

  it('decodes named entities AFTER stripping tags', () => {
    expect(htmlToMarkdown('<p>Tom &amp; Jerry &ndash; &ldquo;hi&rdquo;&hellip;</p>')).toBe(
      'Tom & Jerry – “hi”…',
    );
  });

  it('keeps entity-escaped code samples as literal angle brackets, not tags', () => {
    // &lt;int&gt; must become <int> as TEXT, never be parsed as an HTML tag.
    expect(htmlToMarkdown('<p>Use <strong>List&lt;int&gt;</strong> here.</p>')).toBe(
      'Use **List<int>** here.',
    );
  });

  it('decodes numeric entities', () => {
    expect(htmlToMarkdown('<p>A&#38;B &#x26; C</p>')).toBe('A&B & C');
  });

  it('collapses empty &nbsp; paragraphs and excess blank lines', () => {
    const html = '<p>A</p><p>&nbsp;</p><ul><li>x</li><li>y</li></ul>';
    expect(htmlToMarkdown(html)).toBe('A\n\n- x\n- y');
  });

  it('strips unknown tags while keeping content', () => {
    expect(htmlToMarkdown('<section><p>Hello <mark>world</mark></p></section>')).toBe('Hello world');
  });

  it('preserves fenced code blocks containing angle brackets and ampersands', () => {
    const md =
      'Beispiel:\n\n```csharp\nList<int> zahlen = new List<int>();\nif (a < 10 && b > 0) { }\n```\n\nFertig.';
    // Code darf NICHT als HTML interpretiert/entfernt werden.
    expect(htmlToMarkdown(md)).toBe(md);
  });

  it('preserves inline code with angle brackets', () => {
    expect(htmlToMarkdown('Nutze `List<int>` und `a < b` hier.')).toBe(
      'Nutze `List<int>` und `a < b` hier.',
    );
  });

  it('still converts HTML around protected code', () => {
    expect(htmlToMarkdown('<p>Siehe <strong>`List<int>`</strong> unten</p>')).toBe(
      'Siehe **`List<int>`** unten',
    );
  });
});
