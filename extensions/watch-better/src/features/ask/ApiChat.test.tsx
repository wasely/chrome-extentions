import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tutorialTranscript } from '@/test/fixtures/transcripts';
import { ApiChat } from './ApiChat';
const state = vi.hoisted(() => ({ stream: vi.fn() }));
vi.mock('./api-client', () => ({ streamApiAnswer: state.stream }));

describe('API chat', () => {
  beforeEach(() => {
    state.stream.mockReset();
  });
  it('sends bounded transcript context and carries follow-up history', async () => {
    state.stream.mockResolvedValue('The answer [00:10].');
    render(<ApiChat transcript={tutorialTranscript} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Explain this video' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('The answer [00:10].');
    expect(state.stream.mock.calls[0]?.[0]).toBe(tutorialTranscript.videoId);
    expect(JSON.stringify(state.stream.mock.calls[0]?.[2])).toContain(
      'TRANSCRIPT CONTEXT',
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Give an example' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(state.stream).toHaveBeenCalledTimes(2));
    expect(state.stream.mock.calls[1]?.[2]).toEqual(
      expect.arrayContaining([{ role: 'assistant', content: 'The answer [00:10].' }]),
    );
  });
  it('stops a request, keeps its partial answer, and never retries automatically', async () => {
    state.stream.mockImplementation(
      (
        _video: string,
        _session: string,
        _messages: unknown,
        signal: AbortSignal,
        delta: (text: string) => void,
      ) =>
        new Promise((_resolve, reject) => {
          delta('Partial evidence');
          signal.addEventListener('abort', () => reject(new Error('Stopped')));
        }),
    );
    const view = render(<ApiChat transcript={tutorialTranscript} />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick Learn' }));
    await screen.findByText('Partial evidence');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
      await Promise.resolve();
    });
    expect(screen.getByText('Partial evidence')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Stopped');
    expect(state.stream).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
