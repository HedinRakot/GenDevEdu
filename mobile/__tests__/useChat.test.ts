import { act, renderHook, waitFor } from '@testing-library/react-native';

import i18n from '@/i18n';

jest.mock('@/api/chat', () => ({ sendChatStreaming: jest.fn() }));

import { useChat } from '@/hooks/useChat';
import { sendChatStreaming } from '@/api/chat';
import { clearChatHistory, getChatHistory } from '@/store/storage';

const mockedStream = sendChatStreaming as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  await clearChatHistory();
});

describe('useChat', () => {
  it('streams the assistant answer and persists both messages', async () => {
    mockedStream.mockImplementation(async (_text, _history, onChunk) => {
      onChunk('Hallo ', 'Hallo ');
      onChunk('Welt', 'Hallo Welt');
      return 'Hallo Welt';
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Wie funktionieren Schleifen?');
    });

    await waitFor(() => expect(result.current.isSending).toBe(false));

    expect(result.current.messages.map((m) => m.role)).toEqual(['user', 'model']);
    const ai = result.current.messages.find((m) => m.role === 'model');
    expect(ai?.content).toBe('Hallo Welt');
    expect(ai?.isStreaming).toBeFalsy();

    // Persistiert in AsyncStorage.
    const stored = await getChatHistory();
    expect(stored.at(-1)?.content).toBe('Hallo Welt');
  });

  it('writes an error marker when the stream fails', async () => {
    mockedStream.mockRejectedValue(new Error('CHAT_FAILED'));
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hi');
    });
    await waitFor(() => expect(result.current.isSending).toBe(false));

    const ai = result.current.messages.find((m) => m.role === 'model');
    expect(ai?.content).toBe(i18n.t('chat.errorSending'));
  });

  it('ignores empty input', async () => {
    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage('   ');
    });
    expect(mockedStream).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });
});
