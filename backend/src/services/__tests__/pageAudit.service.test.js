const { parseHtml } = require('../pageAudit.service');

describe('parseHtml', () => {
  // --- Happy path ---
  it('extracts title, meta description, h1 count, alt-missing images, and word count from valid HTML', () => {
    const html = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="A sample page for testing" />
        </head>
        <body>
          <h1>Welcome</h1>
          <p>This is some visible body text with several words in it.</p>
          <img src="/logo.png" alt="Company logo" />
          <img src="/banner.png" alt="" />
          <img src="/icon.png" />
        </body>
      </html>
    `;

    const result = parseHtml(html);

    expect(result.title).toBe('Test Page');
    expect(result.metaDescription).toBe('A sample page for testing');
    expect(result.h1Count).toBe(1);
    expect(result.imagesMissingAltCount).toBe(2);
    expect(result.imagesMissingAlt).toEqual(['/banner.png', '/icon.png']);
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it('excludes script and style content from word count', () => {
    const html = `
      <html>
        <head><title>Scripty</title></head>
        <body>
          <p>Real content here</p>
          <script>var thisShouldNotBeCountedAsWords = "a b c d e f g";</script>
          <style>.hidden { display: none; content: "more words here"; }</style>
        </body>
      </html>
    `;

    const result = parseHtml(html);

    // "Real content here" = 3 words. If script/style leaked in, this would be much higher.
    expect(result.wordCount).toBe(3);
  });

  // --- Failure case 1: malformed HTML ---
  it('gracefully handles malformed HTML without throwing', () => {
    const malformedHtml = `
      <html>
        <head><title>Broken Page
        <body>
          <h1>Heading without closing tag
          <p>Some text <img src="/no-alt.png">
    `;

   expect(() => parseHtml(malformedHtml)).not.toThrow();

const result = parseHtml(malformedHtml);

// Verify that parsing succeeds and returns the expected structure.
expect(result).toBeDefined();

expect(result).toEqual(
  expect.objectContaining({
    h1Count: expect.any(Number),
    imagesMissingAlt: expect.any(Array),
    imagesMissingAltCount: expect.any(Number),
    wordCount: expect.any(Number),
  })
);

// Title may or may not be recovered depending on how Cheerio repairs the HTML.
expect(result.title === null || typeof result.title === 'string').toBe(true);
  });

  // --- Failure case 2: empty / non-HTML input ---
  it('returns safe defaults for an empty string instead of throwing', () => {
    const result = parseHtml('');

    expect(result.title).toBeNull();
    expect(result.metaDescription).toBeNull();
    expect(result.h1Count).toBe(0);
    expect(result.imagesMissingAltCount).toBe(0);
    expect(result.imagesMissingAlt).toEqual([]);
    expect(result.wordCount).toBe(0);
  });

  it('does not throw on plain non-HTML text content', () => {
    const plainText = 'just a raw string, not markup at all, no tags here';

    expect(() => parseHtml(plainText)).not.toThrow();

    const result = parseHtml(plainText);
    expect(result.title).toBeNull();
    expect(result.h1Count).toBe(0);
    // Cheerio treats untagged text as body content, so word count should reflect it.
    expect(result.wordCount).toBeGreaterThan(0);
  });
});