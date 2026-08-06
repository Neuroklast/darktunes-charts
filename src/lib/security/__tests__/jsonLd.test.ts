import { describe, it, expect } from 'vitest';
import { safeJsonLd } from '../jsonLd';

describe('safeJsonLd', () => {
  it('should serialize standard JSON properly', () => {
    const data = {
      name: "The Beatles",
      genre: ["Rock", "Pop"],
      url: "https://example.com"
    };
    const result = safeJsonLd(data);
    expect(result).toBe('{"name":"The Beatles","genre":["Rock","Pop"],"url":"https:\\/\\/example.com"}');
  });

  it('should handle undefined by returning an empty string', () => {
    expect(safeJsonLd(undefined)).toBe('');
  });

  it('should escape < and > to prevent script injection', () => {
    const data = {
      name: "<script>alert('XSS')</script>"
    };
    const result = safeJsonLd(data);
    // expect the script tags to be encoded:
    // < to \u003c
    // > to \u003e
    // / to \/
    // ' to \u0027
    expect(result).toContain('\\u003cscript\\u003ealert(\\u0027XSS\\u0027)\\u003c\\/script\\u003e');
  });

  it('should escape & and \' inside strings', () => {
    // testing characters that could break out of quotes or context
    const data = {
      bio: "It's a band & they rock."
    };
    const result = safeJsonLd(data);

    expect(result).toContain('It\\u0027s a band \\u0026 they rock.');
  });

  it('should escape forward slashes to prevent closing tags like </script>', () => {
    const data = {
      path: "/admin/login"
    };
    const result = safeJsonLd(data);

    expect(result).toContain('\\/admin\\/login');
  });
});
