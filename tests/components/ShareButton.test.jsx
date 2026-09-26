import { describe, expect, it, vi } from 'vitest';
import ShareButton from '../../src/components/ShareButton.jsx';
import { act } from 'react';
import { click, find, findAll, render, settle, stubClipboard } from '../helpers/dom.js';

/** React state updates that follow an async handler need one more tick. */
const flush = () => act(async () => {});

describe('ShareButton', () => {
  it('opens the share menu on click', () => {
    const { container } = render(<ShareButton />);

    expect(findAll(container, '.share-menu')).toHaveLength(0);

    click(find(container, '.share-btn'));

    expect(find(container, '.share-menu')).toBeTruthy();
    expect(find(container, '.share-overlay')).toBeTruthy();
  });

  it('copies the current url to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const { container } = render(<ShareButton />);

    click(find(container, '.share-btn'));
    click(find(container, '.share-menu-item'));
    await flush();

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(find(container, '.share-menu-item').textContent).toContain('Gekopieerd!');
  });

  it('keeps the menu usable when the clipboard rejects', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    stubClipboard(writeText);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<ShareButton />);

    click(find(container, '.share-btn'));
    click(find(container, '.share-menu-item'));
    await flush();

    expect(consoleError).toHaveBeenCalled();
    expect(find(container, '.share-menu-item').textContent).toContain('Kopieer link');
  });

  it('opens WhatsApp with the encoded page url', () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const { container } = render(<ShareButton />);

    click(find(container, '.share-btn'));
    click(findAll(container, '.share-menu-item')[1]);

    expect(open).toHaveBeenCalledTimes(1);
    const [url, target] = open.mock.calls[0];
    expect(target).toBe('_blank');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url)).toContain(window.location.href);
  });

  it('closes the menu when the overlay is clicked', async () => {
    const { container } = render(<ShareButton />);

    click(find(container, '.share-btn'));
    click(find(container, '.share-overlay'));
    await settle();

    // AnimatePresence removes the menu once the exit animation has finished.
    expect(findAll(container, '.share-menu')).toHaveLength(0);
  });
});
