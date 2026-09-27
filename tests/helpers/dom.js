import { act } from 'react';
import { createRoot } from 'react-dom/client';

// ── jsdom gaps ────────────────────────────────────────────────────────────────
// jsdom implements neither matchMedia nor the clipboard API, both of which the
// app uses. The stubs below are deterministic versions of those browser APIs.

const mediaListeners = new Set();
const mediaQueryList = {
  media: '(prefers-color-scheme: dark)',
  matches: false,
  onchange: null,
  addEventListener: (type, listener) => {
    if (type === 'change') mediaListeners.add(listener);
  },
  removeEventListener: (type, listener) => {
    if (type === 'change') mediaListeners.delete(listener);
  },
  addListener: (listener) => mediaListeners.add(listener),
  removeListener: (listener) => mediaListeners.delete(listener),
  dispatchEvent: () => false,
};

export function installBrowserStubs() {
  window.matchMedia = () => mediaQueryList;
  // framer-motion calls scrollTo when it measures layout.
  window.scrollTo = () => {};
}

/** Pretend the operating system switched between light and dark. */
export function setPrefersDark(matches) {
  mediaQueryList.matches = matches;
  for (const listener of [...mediaListeners]) {
    listener({ matches, media: mediaQueryList.media });
  }
}

export function mediaListenerCount() {
  return mediaListeners.size;
}

/** Replace navigator.clipboard with a spy (jsdom ships no clipboard). */
export function stubClipboard(writeText) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

export function resetBrowserStubs() {
  mediaQueryList.matches = false;
  mediaListeners.clear();
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
}

// ── tiny render/query helpers (react-dom only, no test-library dependency) ────

const mountedRoots = [];

export function render(ui) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    unmount() {
      act(() => root.unmount());
      const index = mountedRoots.indexOf(root);
      if (index !== -1) mountedRoots.splice(index, 1);
      container.remove();
    },
  };
}

export function cleanup() {
  for (const root of mountedRoots.splice(0)) {
    act(() => root.unmount());
  }
  document.body.innerHTML = '';
}

/**
 * Let framer-motion finish its enter/exit animations. jsdom runs them on real
 * animation frames, so a state change only becomes visible in the DOM after a
 * handful of frames (AnimatePresence renders the new panel when the old one has
 * finished exiting).
 */
export async function settle(frames = 40) {
  for (let index = 0; index < frames; index++) {
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    });
  }
}

export function find(container, selector) {
  const element = container.querySelector(selector);
  if (!element) {
    throw new Error(`No element matched ${selector}`);
  }
  return element;
}

export function findAll(container, selector) {
  return [...container.querySelectorAll(selector)];
}

export function buttonByText(container, text) {
  const button = findAll(container, 'button').find((candidate) =>
    candidate.textContent.includes(text)
  );
  if (!button) {
    throw new Error(`No button containing ${text}`);
  }
  return button;
}

export function click(element) {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** Set an input's value the way React's onChange expects it. */
export function setInputValue(element, value) {
  const prototype = Object.getPrototypeOf(element);
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  act(() => {
    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
