import { filterGlossary, GLOSSARY } from '@/data/glossary';

describe('filterGlossary', () => {
  it('returns all entries when query is empty', () => {
    expect(filterGlossary('')).toHaveLength(GLOSSARY.length);
    expect(filterGlossary('   ')).toHaveLength(GLOSSARY.length);
  });

  it('matches term case-insensitively', () => {
    const out = filterGlossary('CLOSURE');
    expect(out.map((e) => e.id)).toContain('closure');
  });

  it('matches keywords', () => {
    const out = filterGlossary('async');
    expect(out.map((e) => e.id)).toContain('promise');
  });

  it('matches against localized definitions', () => {
    const out = filterGlossary('BSON');
    expect(out.some((e) => e.id === 'mongo-document')).toBe(true);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterGlossary('xyz-no-match-anywhere-1234')).toHaveLength(0);
  });
});
