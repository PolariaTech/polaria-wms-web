export interface MateoWidgetTokenResponse {
  token: string;
  expiresIn: number;
}

export type MateoTokenFetcher = () => Promise<MateoWidgetTokenResponse>;

export interface MateoWidgetMountOptions {
  n8nWebhookUrl?: string;
  onAuthError?: () => void;
  shadowDom?: boolean;
  conversationApiBase?: string;
  conversationTokenFetcher?: MateoTokenFetcher;
  locale?: "es" | "en";
}

/**
 * Contrato del bundle Widget-react (`window.MateoWidget`).
 */
export interface MateoWidgetApi {
  configureTokenFetcher: (fetcher: MateoTokenFetcher) => void;
  init?: (
    options: { container: HTMLElement; tokenFetcher?: MateoTokenFetcher } & MateoWidgetMountOptions,
  ) => { unmount: () => void; close: () => void };
  mount: (
    target: HTMLElement,
    options?: MateoWidgetMountOptions,
  ) => void | Promise<void> | { unmount: () => void; close: () => void };
  unmount?: (target?: HTMLElement) => void;
  close?: () => void;
}

declare global {
  interface Window {
    MateoWidget?: MateoWidgetApi;
    __MateoWidget__?: MateoWidgetApi;
  }
}

export {};
