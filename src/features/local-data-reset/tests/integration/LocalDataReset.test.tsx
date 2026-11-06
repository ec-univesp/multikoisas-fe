import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { imageStore } from '@/shared/local-api/imageStore';
import { loadDatabase, saveDatabase, STORAGE_KEY } from '@/shared/local-api/persistence';
import { LocalDataReset } from '../../LocalDataReset';

const reload = vi.fn();

beforeEach(() => {
  vi.stubGlobal('location', { ...window.location, reload });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  reload.mockReset();
  localStorage.clear();
});

const openDialog = async () => {
  render(<LocalDataReset />);
  await userEvent.click(screen.getByRole('button', { name: 'Restaurar dados iniciais' }));
};

const WARNING = 'Isso apaga tudo que foi cadastrado neste navegador e volta para os dados de exemplo.';

describe('LocalDataReset', () => {
  it('asks before erasing what was registered in this browser', async () => {
    await openDialog();
    expect(screen.getByRole('heading', { name: 'Restaurar dados iniciais?' })).toBeInTheDocument();
    expect(screen.getByText(WARNING)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it('brings back the sample data, forgets the saved photos and reloads the page', async () => {
    const database = loadDatabase();
    database.products = [];
    saveDatabase(database);
    await imageStore.save(99, new Blob(['foto'], { type: 'image/png' }));

    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar' }));

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(loadDatabase().products).toHaveLength(5);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(await imageStore.get(99)).toBeUndefined();
  });

  it('tells the person when the browser refuses the reset and lets the dialog close', async () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível restaurar os dados. Recarregue a página e tente de novo.',
    );
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });
});
