/**
 * Securely serializes an object to JSON-LD by escaping potentially dangerous characters.
 * This prevents XSS vulnerabilities when the JSON-LD is embedded in a `<script>` tag
 * using `dangerouslySetInnerHTML`.
 *
 * It escapes `<`, `>`, `&`, `'`, `"`, and `/` to their Unicode hex equivalents.
 *
 * @param data The object to serialize.
 * @returns A safe JSON string.
 */
export function safeJsonLd(data: unknown): string {
  if (data === undefined) {
    return '';
  }

  const json = JSON.stringify(data);
  return json.replace(/[<>&']/g, (c) => {
    switch (c) {
      case '<': return '\\u003c';
      case '>': return '\\u003e';
      case '&': return '\\u0026';
      case "'": return '\\u0027';
      default: return c;
    }
  }).replace(/\//g, '\\/'); // escape forward slash independently
}
