import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { refinementMessages } from '../../src/refinementMessages';
import MovieSearch from '../../src/MovieSearch';
import AuthForm from '../../src/AuthForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key, values) => (refinementMessages.en[key] || key).replace('{{title}}', values?.title || '') }),
  Trans: () => null,
}));
vi.mock('../../src/services/lists', () => ({ currentUser: vi.fn(), migrateGuest: vi.fn(), authenticate: vi.fn() }));
import { currentUser, migrateGuest } from '../../src/services/lists';

beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('search failure can be retried and a movie added using keyboard controls', async () => {
  fetch.mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(Response.json({ results: [{ id: 348, title: 'Alien', release_date: '1979-05-25' }] }));
  const onSelect = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<MovieSearch id="test-search" label="Add movie" adding onSelect={onSelect} />);
  await user.type(screen.getByLabelText('Add movie'), 'Alien');
  await screen.findByText(refinementMessages.en.movie_unconfigured);
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  const result = await screen.findByRole('button', { name: /Alien.*Add to list/ });
  result.focus();
  await user.keyboard('{Enter}');
  await screen.findByText('Alien is in your list.');
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 348 }));
  expect(screen.getByLabelText('Add movie').value).toBe('');
});

test('failed movie saves keep the result available to retry', async () => {
  fetch.mockResolvedValue(Response.json({ results: [{ id: 348, title: 'Alien' }] }));
  const onSelect = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  render(<MovieSearch id="save-search" label="Add movie" adding onSelect={onSelect} />);
  await user.type(screen.getByLabelText('Add movie'), 'Alien');
  await user.click(await screen.findByRole('button', { name: /Alien.*Add to list/ }));
  await screen.findByText(refinementMessages.en.movie_save_error);
  expect(screen.getByRole('searchbox', { name: 'Add movie' }).value).toBe('Alien');
  await user.click(screen.getByRole('button', { name: /Alien.*Add to list/ }));
  await screen.findByText('Alien is in your list.');
  expect(onSelect).toHaveBeenCalledTimes(2);
});

test('clearing a search prevents an older response from restoring stale results', async () => {
  let finish;
  fetch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const user = userEvent.setup();
  render(<MovieSearch id="race-search" label="Search" onSelect={vi.fn()} />);
  await user.type(screen.getByLabelText('Search'), 'Alien');
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  await user.clear(screen.getByLabelText('Search'));
  finish(Response.json({ results: [{ id: 348, title: 'Alien' }] }));
  await waitFor(() => expect(screen.queryByRole('button', { name: /Alien/ })).toBeNull());
});

test('signed-in users can retry an import without entering credentials again', async () => {
  currentUser.mockResolvedValue({ $id: 'user' });
  migrateGuest.mockRejectedValueOnce(new Error('import_permission_error')).mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  render(<MemoryRouter><AuthForm /></MemoryRouter>);
  await screen.findByRole('heading', { name: 'Import guest lists' });
  expect(screen.queryByLabelText('password')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Import remaining lists' }));
  await screen.findByText(refinementMessages.en.import_permission_error);
  expect(screen.getByRole('link', { name: refinementMessages.en.continue_without_import })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Import remaining lists' }));
  await waitFor(() => expect(migrateGuest).toHaveBeenCalledTimes(2));
});
