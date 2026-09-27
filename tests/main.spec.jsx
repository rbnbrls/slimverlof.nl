import { describe, expect, it } from 'vitest';
import { act } from 'react';

// main.jsx is the browser entry point: import it with a real #root in place so
// the mounted markup (and therefore the entry module) is covered too.
describe('main entry point', () => {
  it('mounts the app into #root', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    await act(async () => {
      await import('../src/main.jsx');
    });

    expect(root.textContent).toContain('slimverlof.nl');
    expect(root.querySelector('.container')).toBeTruthy();
  });
});
