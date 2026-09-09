import { useEffect, useRef, useState } from 'react';
import type { AskPanelProps } from './AskPanel';
import type { ApiMessage } from './api-provider';
import type { AIContextScope } from './ai-provider';
import { streamApiAnswer } from './api-client';
import { TranscriptPromptProvider } from './transcript-prompt-provider';
import './ApiChat.css';

const prompts = new TranscriptPromptProvider(16_000);
const EMPTY_SELECTION = new Set<string>();

export function ApiChat(props: AskPanelProps) {
  const [question, setQuestion] = useState('');
  const [scope, setScope] = useState<AIContextScope>(
    props.initialScope ?? 'entire-video',
  );
  const [turns, setTurns] = useState<ApiMessage[]>([]);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  useEffect(() => () => controller.current?.abort(), []);

  const send = async (text: string) => {
    if (!props.transcript || busy || !text.trim()) return;
    const abort = new AbortController();
    controller.current = abort;
    const prior = turns.slice(-8);
    const prompt = prompts.buildPrompt({
      transcript: props.transcript,
      scope,
      question: text,
      currentTimeSeconds: props.currentTimeSeconds ?? null,
      selectedSegmentIds: props.selectedSegmentIds ?? EMPTY_SELECTION,
    });
    // Bound previous answers independently of the current transcript selection.
    const messages: ApiMessage[] = [
      ...prior.map((turn) => ({ ...turn, content: turn.content.slice(0, 2_000) })),
      { role: 'user', content: prompt.text },
    ];
    setTurns([...prior, { role: 'user', content: text }]);
    setQuestion('');
    setPartial('');
    setError('');
    setBusy(true);
    let answer = '';
    try {
      answer = await streamApiAnswer(
        props.transcript.videoId,
        sessionId,
        messages,
        abort.signal,
        (delta) => {
          answer += delta;
          setPartial(answer);
        },
      );
    } catch (cause) {
      setError(
        abort.signal.aborted
          ? 'Stopped. Partial answer kept.'
          : cause instanceof Error
            ? cause.message
            : 'Request failed. Try again when ready.',
      );
    } finally {
      if (answer)
        setTurns((current) => [...current, { role: 'assistant', content: answer }]);
      setPartial('');
      setBusy(false);
      controller.current = null;
    }
  };

  return (
    <section className="ct-api-chat" aria-label="Personal API chat">
      <p className="ct-api-chat__notice">
        Uses your API account. Provider usage charges or free-tier limits may apply.
      </p>
      <div className="ct-api-chat__toolbar">
        <label>
          Context
          <select
            value={scope}
            disabled={busy}
            onChange={(event) => setScope(event.target.value as AIContextScope)}
          >
            <option value="entire-video">Entire video</option>
            <option value="current-section">Current section</option>
            <option value="selection" disabled={!props.selectedSegmentIds?.size}>
              Selected rows
            </option>
          </select>
        </label>
        <button
          type="button"
          disabled={busy || !turns.length}
          onClick={() => {
            setTurns([]);
            setError('');
          }}
        >
          New chat
        </button>
      </div>
      {!props.transcript && <p>Load captions before asking a question.</p>}
      <div className="ct-api-chat__messages" role="log" aria-label="Conversation">
        {turns.map((turn, index) => (
          <article key={index}>
            <strong>{turn.role === 'user' ? 'You' : 'Assistant'}</strong>
            <p>{turn.content}</p>
          </article>
        ))}
        {partial && (
          <article>
            <strong>Assistant</strong>
            <p>{partial}</p>
          </article>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(question);
        }}
      >
        <label>
          Ask about this video
          <textarea
            maxLength={4_000}
            value={question}
            disabled={busy}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What are the key points?"
          />
        </label>
        <div className="ct-api-chat__toolbar">
          <button
            type="button"
            disabled={busy || !props.transcript}
            onClick={() =>
              void send(
                'Explain the main ideas, practical takeaways, and useful timestamps in this video. Keep it concise and grounded in the transcript.',
              )
            }
          >
            Quick Learn
          </button>
          {busy ? (
            <button type="button" onClick={() => controller.current?.abort()}>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={
                !props.transcript ||
                !question.trim() ||
                (scope === 'selection' && !props.selectedSegmentIds?.size)
              }
            >
              Send
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
