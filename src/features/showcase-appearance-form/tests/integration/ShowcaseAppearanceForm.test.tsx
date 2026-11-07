import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { ShowcaseAppearanceForm } from '../../ShowcaseAppearanceForm';

const COLUMNS_LABEL = 'Colunas na vitrine (computador)';

describe('ShowcaseAppearanceForm saving', () => {
  it('waits for the saved appearance and starts with it', async () => {
    apiDatabase.storeSettings.showcaseColumns = 2;
    render(<ShowcaseAppearanceForm />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(await screen.findByLabelText(COLUMNS_LABEL)).toHaveValue('2');
  });

  it('offers to try again, without the fields, when the saved appearance cannot be read', async () => {
    server.use(http.get('*/configuracao', () => new HttpResponse(null, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    render(<ShowcaseAppearanceForm />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a aparência da vitrine.');
    expect(screen.queryByLabelText(COLUMNS_LABEL)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByLabelText(COLUMNS_LABEL)).toBeInTheDocument();
  });

  it('saves three columns and the chosen accent color, keeping the address', async () => {
    const user = userEvent.setup();
    render(<ShowcaseAppearanceForm />);
    await user.selectOptions(await screen.findByLabelText(COLUMNS_LABEL), '3');
    fireEvent.input(screen.getByLabelText('Cor de destaque'), { target: { value: '#22c55e' } });
    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Dados salvos.');
    expect(apiDatabase.storeSettings).toEqual(
      expect.objectContaining({ showcaseColumns: 3, accentColor: '#22c55e', address: expect.any(String) }),
    );
  });

  it('keeps saving disabled while saving', async () => {
    let answerSave = () => {};
    server.use(
      http.put(
        '*/configuracao',
        () =>
          new Promise<Response>(
            (resolve) => (answerSave = () => resolve(HttpResponse.json(apiDatabase.storeSettings))),
          ),
      ),
    );
    const user = userEvent.setup();
    render(<ShowcaseAppearanceForm />);
    await screen.findByLabelText(COLUMNS_LABEL);

    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    expect(screen.getByRole('button', { name: 'Salvar aparência' })).toBeDisabled();
    expect(screen.getByLabelText(COLUMNS_LABEL)).toBeDisabled();
    expect(screen.getByLabelText('Cor de destaque')).toBeDisabled();
    answerSave();
    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument();
  });

  it('tells when the appearance could not be saved', async () => {
    server.use(http.put('*/configuracao', () => new HttpResponse(null, { status: 507 })));
    const user = userEvent.setup();
    render(<ShowcaseAppearanceForm />);
    await screen.findByLabelText(COLUMNS_LABEL);

    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar os dados.');
    expect(screen.getByRole('button', { name: 'Salvar aparência' })).toBeEnabled();
  });

  it('drops the saved message once a field changes', async () => {
    const user = userEvent.setup();
    render(<ShowcaseAppearanceForm />);
    await screen.findByLabelText(COLUMNS_LABEL);
    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }));
    await screen.findByText('Dados salvos.');

    await user.selectOptions(screen.getByLabelText(COLUMNS_LABEL), '2');

    expect(screen.queryByText('Dados salvos.')).not.toBeInTheDocument();
  });

  it('refuses a color too dark for the showcase text without calling the api', async () => {
    const user = userEvent.setup();
    render(<ShowcaseAppearanceForm />);
    await screen.findByLabelText(COLUMNS_LABEL);

    fireEvent.input(screen.getByLabelText('Cor de destaque'), { target: { value: '#1e3a8a' } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cor muito escura: o texto da vitrine fica ilegível. Escolha uma cor mais clara.',
    );
    expect(screen.getByRole('button', { name: 'Salvar aparência' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Voltar à cor padrão' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiDatabase.storeSettings.accentColor).toBe('#facc15');
  });
});
