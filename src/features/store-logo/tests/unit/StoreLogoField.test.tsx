import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreLogoField } from '../../StoreLogoField';

const image = (name: string, type = 'image/png', size = 3) => new File(['x'.repeat(size)], name, { type });

let previewCount = 0;

beforeEach(() => {
  previewCount = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:logo-${++previewCount}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StoreLogoField', () => {
  it('shows the current logo as the preview', () => {
    render(<StoreLogoField />);

    expect(screen.getByRole('img', { name: 'Logo atual' })).toHaveTextContent('MultiKoisas');
    expect(screen.queryByAltText('Prévia da logo nova')).not.toBeInTheDocument();
  });

  it('previews a chosen image in place of the current logo', async () => {
    const user = userEvent.setup();
    render(<StoreLogoField />);

    await user.upload(screen.getByLabelText('Nova logo'), image('logo.png'));

    expect(screen.getByAltText('Prévia da logo nova')).toHaveAttribute('src', 'blob:logo-1');
    expect(screen.queryByRole('img', { name: 'Logo atual' })).not.toBeInTheDocument();
  });

  it('warns about an image of the wrong type and keeps the current preview', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<StoreLogoField />);
    const logoInput = screen.getByLabelText<HTMLInputElement>('Nova logo');

    await user.upload(logoInput, image('logo.gif', 'image/gif'));

    expect(screen.getByRole('alert')).toHaveTextContent('Use uma imagem JPG, PNG, WebP ou SVG.');
    expect(screen.getByRole('img', { name: 'Logo atual' })).toBeInTheDocument();
    expect(logoInput.value).toBe('');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('warns about an image over 1 MB and keeps the valid preview already chosen', async () => {
    const user = userEvent.setup();
    render(<StoreLogoField />);

    await user.upload(screen.getByLabelText('Nova logo'), image('logo.svg', 'image/svg+xml'));
    await user.upload(screen.getByLabelText('Nova logo'), image('big.png', 'image/png', 1_048_577));

    expect(screen.getByRole('alert')).toHaveTextContent('A imagem passa de 1 MB.');
    expect(screen.getByAltText('Prévia da logo nova')).toHaveAttribute('src', 'blob:logo-1');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('goes back to the current logo on discard, releases the preview and accepts the same file again', async () => {
    const user = userEvent.setup();
    render(<StoreLogoField />);
    const logoInput = screen.getByLabelText<HTMLInputElement>('Nova logo');
    const logo = image('logo.webp', 'image/webp');

    await user.upload(logoInput, logo);
    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo-1');
    expect(screen.getByRole('img', { name: 'Logo atual' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Descartar' })).not.toBeInTheDocument();

    await user.upload(logoInput, logo);

    expect(screen.getByAltText('Prévia da logo nova')).toHaveAttribute('src', 'blob:logo-2');
  });

  it('clears the warning once a valid image is chosen', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<StoreLogoField />);

    await user.upload(screen.getByLabelText('Nova logo'), image('logo.gif', 'image/gif'));
    await user.upload(screen.getByLabelText('Nova logo'), image('logo.png'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('releases the previous preview when another image is chosen and the last one on unmount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<StoreLogoField />);

    await user.upload(screen.getByLabelText('Nova logo'), image('first.png'));
    await user.upload(screen.getByLabelText('Nova logo'), image('second.jpg', 'image/jpeg'));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo-1');
    expect(screen.getByAltText('Prévia da logo nova')).toHaveAttribute('src', 'blob:logo-2');

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenLastCalledWith('blob:logo-2');
  });
});
