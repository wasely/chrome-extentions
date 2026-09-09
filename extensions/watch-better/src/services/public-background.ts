import { createEmailCollector } from '@/features/auth/email-collector';
import { browser } from 'wxt/browser';
import { AuthService } from '@/features/auth/auth-service';
import { isPublicStorageKey } from '@/storage/public-storage';
import { normalizeSettings } from '@/features/settings/settings';
import {
  youtubeTopFrameTabId,
  type ExtensionMessageSender,
} from '@/messaging/sender-policy';
import { ApiService } from './api-service';
import type { ApiMessage } from '@/features/ask/api-provider';

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export const authService = new AuthService(
  browser.storage.local,
  createEmailCollector(import.meta.env.VITE_EMAIL_COLLECTOR_URL ?? ''),
);
export const apiService = new ApiService();
let cleanupFrames: () => Promise<void> = () => Promise.resolve();
export function registerPublicCleanup(cleanup: () => Promise<void>): void {
  cleanupFrames = cleanup;
}

export function isOwnExtensionPage(sender: ExtensionMessageSender): boolean {
  try {
    const url = new URL(sender.url ?? '');
    const base = new URL(browser.runtime.getURL('/'));
    return (
      url.protocol === base.protocol &&
      url.hostname === base.hostname &&
      ['/options.html', '/popup.html'].includes(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function notifyPublicChange(): Promise<void> {
  const tabs = await browser.tabs.query({ url: 'https://www.youtube.com/*' });
  await Promise.allSettled(
    tabs.map((tab) =>
      typeof tab.id === 'number'
        ? browser.tabs.sendMessage(tab.id, { type: 'public:changed' })
        : Promise.resolve(),
    ),
  );
  await browser.runtime.sendMessage({ type: 'public:changed' }).catch(() => undefined);
}

export async function handlePublicRequest(
  message: unknown,
  sender: ExtensionMessageSender,
): Promise<{ ok: boolean; value?: unknown; message?: string }> {
  const request = object(message);
  const trustedPage = isOwnExtensionPage(sender);
  if (!trustedPage && youtubeTopFrameTabId(sender) === null)
    return { ok: false, message: 'This request is not allowed.' };
  try {
    if (request.type === 'public:auth-status') {
      const status = await authService.status();
      return {
        ok: true,
        value:
          status.kind === 'unlocked' && !trustedPage
            ? { ...status, email: '' }
            : status,
      };
    }
    if (request.type === 'public:storage') {
      if (request.area !== 'local' && request.area !== 'session')
        throw new Error('Invalid storage area.');
      const area = request.area;
      const keys =
        request.operation === 'get'
          ? [request.data]
          : request.operation === 'remove'
            ? Array.isArray(request.data)
              ? request.data
              : [request.data]
            : Object.keys(object(request.data));
      if (
        !keys.length ||
        keys.length > 25 ||
        !keys.every((key) => typeof key === 'string' && isPublicStorageKey(area, key))
      )
        throw new Error('Storage access denied.');
      if (request.operation === 'get') {
        if (typeof request.data !== 'string') throw new Error('Invalid storage key.');
        return { ok: true, value: await browser.storage[area].get(request.data) };
      }
      if (request.operation === 'set') {
        const values = object(request.data);
        if (JSON.stringify(values).length > 2_100_000)
          throw new Error('Storage value is too large.');
        if (area === 'local')
          for (const key of keys as string[])
            values[key] = normalizeSettings(values[key]);
        await browser.storage[area].set(values);
      } else if (request.operation === 'remove')
        await browser.storage[area].remove(keys as string[]);
      else throw new Error('Invalid storage operation.');
      return { ok: true };
    }
    if (request.type === 'public:api-status')
      return { ok: true, value: await apiService.status() };
    if (request.type === 'public:api-mode') {
      if (
        (await authService.status()).kind !== 'unlocked' ||
        typeof request.enabled !== 'boolean'
      )
        throw new Error('Enter your email first.');
      const value = await apiService.setMode(request.enabled);
      await notifyPublicChange();
      return { ok: true, value };
    }
    if (!trustedPage) throw new Error('Open extension settings to manage your email.');
    if (typeof request.type === 'string' && request.type.startsWith('public:api-')) {
      if (new URL(sender.url ?? '').pathname !== '/options.html')
        throw new Error('Use the extension settings page to manage API access.');
      if ((await authService.status()).kind !== 'unlocked')
        throw new Error('Enter your email first.');
      let value: unknown;
      switch (request.type) {
        case 'public:api-configure':
          if (typeof request.key !== 'string' || typeof request.remember !== 'boolean')
            throw new Error('Invalid API configuration.');
          value = await apiService.configure(
            request.config,
            request.key,
            request.remember,
          );
          break;
        case 'public:api-test':
          value = await apiService.test();
          break;
        case 'public:api-models':
          value = await apiService.models();
          break;
        case 'public:api-disconnect':
          await apiService.disconnect();
          value = await apiService.status();
          break;
        default:
          throw new Error('Unsupported API action.');
      }
      await notifyPublicChange();
      return { ok: true, value };
    }
    if (request.type === 'public:enter-email') {
      if (typeof request.email !== 'string') throw new Error('Enter an email address.');
      const value = await authService.enterEmail(
        request.email,
        request.consent === true,
      );
      await notifyPublicChange();
      return { ok: true, value };
    }
    if (request.type === 'public:sign-out') {
      await authService.signOut();
      await apiService.disconnect();
      await cleanupFrames();
      await browser.storage.session.clear();
      await notifyPublicChange();
      return { ok: true, value: { kind: 'signed-out' } };
    }
    throw new Error('Unsupported request.');
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Could not complete the request.',
    };
  }
}

export function registerApiPorts(storageReady: Promise<unknown>): void {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== 'watchbetter:api:v1') return;
    const sender = port.sender ?? {};
    if (!isOwnExtensionPage(sender) && youtubeTopFrameTabId(sender) === null) {
      port.disconnect();
      return;
    }
    let active: AbortController | null = null;
    let disconnected = false;
    const post = (value: unknown) => {
      if (!disconnected) {
        try {
          port.postMessage(value);
        } catch {
          active?.abort();
        }
      }
    };
    port.onDisconnect.addListener(() => {
      disconnected = true;
      active?.abort();
    });
    port.onMessage.addListener((message: unknown) => {
      const request = object(message);
      if (request.type === 'cancel') {
        active?.abort();
        return;
      }
      if (request.type !== 'start' || active) return;
      const requestId = request.requestId;
      if (
        typeof requestId !== 'string' ||
        !/^[a-zA-Z0-9-]{1,100}$/.test(requestId) ||
        typeof request.videoId !== 'string' ||
        !/^[a-zA-Z0-9_-]{11}$/.test(request.videoId) ||
        typeof request.sessionId !== 'string' ||
        request.sessionId.length > 160 ||
        !Array.isArray(request.messages) ||
        request.messages.length > 30
      ) {
        post({ type: 'error', requestId, message: 'Invalid AI request.' });
        return;
      }
      const messages = request.messages.map((value) => object(value));
      if (
        messages.some(
          (message) =>
            !['user', 'assistant'].includes(String(message.role)) ||
            typeof message.content !== 'string',
        ) ||
        JSON.stringify(messages).length > 60_000
      ) {
        post({
          type: 'error',
          requestId,
          message: 'Conversation is too large or invalid.',
        });
        return;
      }
      const controller = new AbortController();
      active = controller;
      void (async () => {
        const heartbeat = setInterval(
          () => post({ type: 'heartbeat', requestId }),
          20_000,
        );
        try {
          await storageReady;
          if (controller.signal.aborted) return;
          if ((await authService.status()).kind !== 'unlocked')
            throw new Error('Enter your email before using AI.');
          const status = await apiService.status();
          if (!status.configuration?.enabled)
            throw new Error('Select Personal API before sending.');
          if (controller.signal.aborted) return;
          const text = await apiService.generate(
            messages as unknown as ApiMessage[],
            controller,
            (delta) => post({ type: 'delta', requestId, delta }),
          );
          post({ type: 'complete', requestId, text });
        } catch (error) {
          post({
            type: 'error',
            requestId,
            message: error instanceof Error ? error.message : 'AI request failed.',
          });
        } finally {
          clearInterval(heartbeat);
          active = null;
        }
      })();
    });
  });
}
