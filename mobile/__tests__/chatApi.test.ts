jest.mock('@/services/apiClient', () => ({ getApiToken: jest.fn().mockResolvedValue('tok') }));
jest.mock('@/services/authEvents', () => ({ emitForceLogout: jest.fn() }));
jest.mock('@/api/gemini', () => ({ sendMessageStreaming: jest.fn() }));

import { sendChatStreaming } from '@/api/chat';
import { emitForceLogout } from '@/services/authEvents';

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

/** Response ohne Stream-Body (nativer Pfad): volle SSE-Antwort über text(). */
function sseResponse(body: string, status = 200): Partial<Response> {
  return {
    ok: status >= 200 && status < 300,
    status,
    body: undefined,
    text: async () => body,
  };
}

describe('sendChatStreaming', () => {
  it('parses SSE delta events and returns the full text', async () => {
    const sse =
      'data: {"delta":"Hallo "}\n\n' +
      'data: {"delta":"Welt"}\n\n' +
      'data: {"done":true}\n\n';
    global.fetch = jest.fn().mockResolvedValue(sseResponse(sse)) as unknown as typeof fetch;

    const chunks: string[] = [];
    const full = await sendChatStreaming('Hi', [], (c) => chunks.push(c));

    expect(chunks).toEqual(['Hallo ', 'Welt']);
    expect(full).toBe('Hallo Welt');
  });

  it('sends the Bearer token and maps model→assistant history', async () => {
    const fetchMock = jest.fn().mockResolvedValue(sseResponse('data: {"done":true}\n\n'));
    global.fetch = fetchMock as unknown as typeof fetch;

    await sendChatStreaming(
      'Frage',
      [{ id: '1', role: 'model', content: 'frühere Antwort', timestamp: 1 }],
      () => {},
    );

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    const sent = JSON.parse(init.body);
    expect(sent.messages).toEqual([
      { role: 'assistant', content: 'frühere Antwort' },
      { role: 'user', content: 'Frage' },
    ]);
  });

  it('reports RAG sources via onSources before done', async () => {
    const sse =
      'data: {"delta":"Antwort"}\n\n' +
      'data: {"sources":[{"title":"Schleifen","kind":"lesson","chapterId":"ch1","courseId":"c1"}]}\n\n' +
      'data: {"done":true}\n\n';
    global.fetch = jest.fn().mockResolvedValue(sseResponse(sse)) as unknown as typeof fetch;

    const sources: any[] = [];
    const full = await sendChatStreaming('Hi', [], () => {}, { onSources: (s) => sources.push(...s) });

    expect(full).toBe('Antwort');
    expect(sources).toEqual([{ title: 'Schleifen', kind: 'lesson', chapterId: 'ch1', courseId: 'c1' }]);
  });

  it('emits force-logout and throws on 401', async () => {
    global.fetch = jest.fn().mockResolvedValue(sseResponse('', 401)) as unknown as typeof fetch;

    await expect(sendChatStreaming('Hi', [], () => {})).rejects.toThrow('UNAUTHORIZED');
    expect(emitForceLogout).toHaveBeenCalled();
  });

  it('throws on network error when no client Gemini key is set (no fallback)', async () => {
    // In Tests ist EXPO_PUBLIC_GEMINI_API_KEY leer → kein Fallback, Fehler propagiert.
    global.fetch = jest.fn().mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;
    await expect(sendChatStreaming('Hi', [], () => {})).rejects.toThrow('Network down');
  });
});
