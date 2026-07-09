import { filterGlossary, GLOSSARY } from '@/data/glossary';

describe('filterGlossary', () => {
  it('returns all entries when query is empty', () => {
    expect(filterGlossary('')).toHaveLength(GLOSSARY.length);
    expect(filterGlossary('   ')).toHaveLength(GLOSSARY.length);
  });

  it('matches term case-insensitively', () => {
    const out = filterGlossary('linq');
    expect(out.map((e) => e.id)).toContain('linq');
  });

  it('matches keywords', () => {
    const out = filterGlossary('asynchron');
    expect(out.map((e) => e.id)).toContain('async-await');
  });

  it('matches against localized definitions', () => {
    const out = filterGlossary('reachable');
    expect(out.some((e) => e.id === 'gc')).toBe(true);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterGlossary('xyz-no-match-anywhere-1234')).toHaveLength(0);
  });
});
