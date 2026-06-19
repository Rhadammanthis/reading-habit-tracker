import { searchBooks, getByIsbn } from './googleBooks';

type FakeResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

function mockFetchOnce(body: unknown, init: Partial<FakeResponse> = {}) {
  const res: FakeResponse = {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  };
  (global.fetch as jest.Mock).mockResolvedValueOnce(res);
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('searchBooks', () => {
  it('short-circuits an empty query without calling the API', async () => {
    const results = await searchBooks('   ');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('normalizes a volume: https cover, ISBN-13 preference, word estimate', async () => {
    mockFetchOnce({
      items: [
        {
          id: 'vol1',
          volumeInfo: {
            title: 'Deep Work',
            authors: ['Cal Newport'],
            pageCount: 300,
            imageLinks: { thumbnail: 'http://books.google.com/cover.jpg' },
            industryIdentifiers: [
              { type: 'ISBN_10', identifier: '1455586692' },
              { type: 'ISBN_13', identifier: '9781455586691' },
            ],
          },
        },
      ],
    });

    const [book] = await searchBooks('deep work', 275);
    expect(book.title).toBe('Deep Work');
    expect(book.author).toBe('Cal Newport');
    expect(book.cover_url).toBe('https://books.google.com/cover.jpg');
    expect(book.isbn).toBe('9781455586691'); // ISBN-13 wins
    expect(book.page_count).toBe(300);
    expect(book.word_count_estimate).toBe(300 * 275);
  });

  it('drops empty (untitled, authorless) results', async () => {
    mockFetchOnce({
      items: [
        { id: 'empty', volumeInfo: {} },
        { id: 'ok', volumeInfo: { title: 'Real Book', pageCount: 100 } },
      ],
    });
    const results = await searchBooks('whatever');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Real Book');
  });

  it('throws on a non-ok response', async () => {
    mockFetchOnce({}, { ok: false, status: 500 });
    await expect(searchBooks('boom')).rejects.toThrow(/500/);
  });
});

describe('getByIsbn', () => {
  it('returns null when nothing matches', async () => {
    mockFetchOnce({ items: [] });
    expect(await getByIsbn('9780000000000')).toBeNull();
  });

  it('falls back to the scanned ISBN when the volume omits one', async () => {
    mockFetchOnce({
      items: [{ id: 'v', volumeInfo: { title: 'Scanned Book', pageCount: 200 } }],
    });
    const book = await getByIsbn('978-3-16-148410-0', 275);
    expect(book).not.toBeNull();
    expect(book!.isbn).toBe('9783161484100'); // hyphens stripped, used as fallback
    expect(book!.word_count_estimate).toBe(200 * 275);
  });

  it('returns null for an empty ISBN without calling the API', async () => {
    expect(await getByIsbn('---')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
