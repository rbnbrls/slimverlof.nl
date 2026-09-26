import { afterEach, vi } from 'vitest';
import { cleanup, installBrowserStubs, resetBrowserStubs } from './helpers/dom.js';

// React's act() requires this flag to run with the act environment enabled.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

installBrowserStubs();

afterEach(() => {
  cleanup();
  resetBrowserStubs();
  vi.restoreAllMocks();
});
