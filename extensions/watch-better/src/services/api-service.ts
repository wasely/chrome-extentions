import { browser } from 'wxt/browser';
import {
  generateApiAnswer,
  normalizeApiConfiguration,
  type ApiConfiguration,
  type ApiMessage,
  type ApiStatus,
} from '@/features/ask/api-provider';

const CONFIG_KEY = 'watchbetter:api-config:v1';
const KEY = 'watchbetter:api-key:v1';
const own = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export class ApiService {
  readonly controllers = new Set<AbortController>();
  async status(): Promise<ApiStatus> {
    const local = await browser.storage.local.get([CONFIG_KEY, KEY]);
    const session = await browser.storage.session.get(KEY);
    let configuration: ApiConfiguration | null = null;
    try {
      configuration = normalizeApiConfiguration(local[CONFIG_KEY]);
    } catch {
      /* No configured provider. */
    }
    return {
      connected: !!configuration && typeof (session[KEY] ?? local[KEY]) === 'string',
      configuration,
      remembered: typeof local[KEY] === 'string',
    };
  }
  async configure(input: unknown, key: string, remember: boolean): Promise<ApiStatus> {
    const configuration = normalizeApiConfiguration(input);
    const previous = await this.status();
    if (!key.trim() || key.length > 4096 || /[\r\n]/.test(key))
      throw new Error('Enter a valid API key.');
    if (
      !(await browser.permissions.contains({
        origins: [`${new URL(configuration.baseUrl).origin}/*`],
      }))
    )
      throw new Error('Allow access to the selected API endpoint first.');
    this.cancelAll();
    await browser.storage.local.remove(KEY);
    await browser.storage.session.remove(KEY);
    await browser.storage[remember ? 'local' : 'session'].set({ [KEY]: key.trim() });
    await browser.storage.local.set({ [CONFIG_KEY]: configuration });
    if (
      previous.configuration &&
      new URL(previous.configuration.baseUrl).origin !==
        new URL(configuration.baseUrl).origin
    )
      await browser.permissions
        .remove({ origins: [`${new URL(previous.configuration.baseUrl).origin}/*`] })
        .catch(() => false);
    return this.status();
  }
  async setMode(enabled: boolean): Promise<ApiStatus> {
    const state = await this.status();
    if ((enabled && !state.connected) || !state.configuration)
      throw new Error('Connect your personal API in Advanced settings first.');
    this.cancelAll();
    await browser.storage.local.set({
      [CONFIG_KEY]: { ...state.configuration, enabled },
    });
    return this.status();
  }
  async disconnect(): Promise<void> {
    const state = await this.status();
    this.cancelAll();
    await browser.storage.local.remove([KEY, CONFIG_KEY]);
    await browser.storage.session.remove(KEY);
    if (state.configuration)
      await browser.permissions
        .remove({ origins: [`${new URL(state.configuration.baseUrl).origin}/*`] })
        .catch(() => false);
  }
  cancelAll(): void {
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
  }
  async #connection(): Promise<{ configuration: ApiConfiguration; key: string }> {
    const status = await this.status();
    if (!status.connected || !status.configuration)
      throw new Error('Connect your API key in Advanced settings.');
    const session = await browser.storage.session.get(KEY);
    const local = await browser.storage.local.get(KEY);
    const key = session[KEY] ?? local[KEY];
    if (typeof key !== 'string')
      throw new Error('Your session key has expired. Reconnect it in settings.');
    if (
      !(await browser.permissions.contains({
        origins: [`${new URL(status.configuration.baseUrl).origin}/*`],
      }))
    )
      throw new Error('API access was removed. Reconnect it in settings.');
    return { configuration: status.configuration, key };
  }
  async generate(
    messages: readonly ApiMessage[],
    controller: AbortController,
    onDelta: (text: string) => void,
  ): Promise<string> {
    this.controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const connection = await this.#connection();
      return await generateApiAnswer(
        connection.configuration,
        connection.key,
        messages,
        controller.signal,
        onDelta,
      );
    } catch (error) {
      if (controller.signal.aborted)
        throw new Error(
          'Request stopped or timed out. Retry only if you want another API request.',
          { cause: error },
        );
      throw error;
    } finally {
      clearTimeout(timeout);
      this.controllers.delete(controller);
    }
  }
  async test(): Promise<string> {
    await this.generate(
      [{ role: 'user', content: 'Reply only OK.' }],
      new AbortController(),
      () => undefined,
    );
    return 'Connection works. Provider usage charges may apply.';
  }
  async models(): Promise<string[]> {
    const { configuration, key } = await this.#connection();
    const gemini = configuration.kind === 'gemini';
    const response = await fetch(`${configuration.baseUrl}/models`, {
      credentials: 'omit',
      redirect: 'error',
      headers: gemini ? { 'x-goog-api-key': key } : { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error(
        'This provider cannot list models. Enter the model identifier manually.',
      );
    const body = own(await response.json());
    const models = gemini ? body.models : body.data;
    return Array.isArray(models)
      ? models
          .slice(0, 500)
          .map((model) => own(model)[gemini ? 'name' : 'id'])
          .filter((id): id is string => typeof id === 'string')
          .map((id) => id.replace(/^models\//, ''))
      : [];
  }
}
