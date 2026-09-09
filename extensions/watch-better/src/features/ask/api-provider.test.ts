import { describe, expect, it } from 'vitest';
import { normalizeApiConfiguration, readApiStream } from './api-provider';

describe('personal API boundaries', () => {
  it('normalizes known protocols and blocks unsafe endpoints', () => {
    expect(
      normalizeApiConfiguration({ kind: 'gemini', model: 'gemini-test' }),
    ).toMatchObject({ baseUrl: 'https://generativelanguage.googleapis.com/v1beta' });
    expect(
      normalizeApiConfiguration({
        kind: 'openai-compatible',
        baseUrl: 'https://api.example.com/v1/',
        model: 'model',
      })?.baseUrl,
    ).toBe('https://api.example.com/v1');
    for (const baseUrl of [
      'http://example.com/v1',
      'https://key:secret@example.com',
      'https://localhost/v1',
      'https://127.0.0.1',
      'https://example.com/?key=secret',
      'file:///tmp',
    ])
      expect(() =>
        normalizeApiConfiguration({
          kind: 'openai-compatible',
          baseUrl,
          model: 'model',
        }),
      ).toThrow();
  });
  it('joins fragmented SSE frames without mixing metadata into answers', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"con',
      'tent":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\ndata: [DONE]\n\n',
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const value of chunks) controller.enqueue(new TextEncoder().encode(value));
        controller.close();
      },
    });
    const updates: string[] = [];
    expect(
      await readApiStream(stream, 'openai-compatible', (text) => updates.push(text)),
    ).toBe('Hello world');
    expect(updates).toEqual(['Hello', ' world']);
  });
  it('reads Gemini chunks and rejects malformed model output', async () => {
    const response = new Response(
      'data: {"candidates":[{"content":{"parts":[{"text":"English answer"}]}}]}\n\n',
    );
    expect(await readApiStream(response.body!, 'gemini', () => undefined)).toBe(
      'English answer',
    );
    const invalid = new Response('data: not-json\n\n');
    await expect(
      readApiStream(invalid.body!, 'gemini', () => undefined),
    ).rejects.toThrow();
  });
});
